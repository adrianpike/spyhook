Spyhook
=======

Have you ever really wished you could just _measure things_ in your webapps? To not think about what the backend looks like, how you query the data, or if it's going to cost you in performance? What about if you have a more robust client app, and you want to metricize events that might not hit the server?

I have. The "winningest" solution I've used so far was to use Google Analytics, but:
 - You can't use it from your server code.
 - Building complex queries off the data can be a royal pain, and often requires adjusting how you measure things.
 - Scoping things per-user is a royal pain^2.

Enter Spyhook. Let's show how you would record some events on the client.

    <script type="text/javascript" src="https://spyhook.example.local/spyhook.js"></script>
    <script type="text/javascript">
      Spyhook.host('https://spyhook.example.local'); // This is required.
      Spyhook.globals({keys: { user_id: 'hashed_info', session: '2879hdso123' } }); // These will be merged into every Spyhook request.
      // We include both a unique session key and a user id if there is one, so we can analyze a session all the way out to it's first hit
      // on the site, and match it to a user once they sign up or log in.
    </script>

    <script type="text/javascript">
      $('a').click(function(e) {
        Spyhook.record('clicked-on-something'); // We'll increment our count of clicked-on-something, as well as an event for that user session key (if we provided one!)
      });
      $('#foobar').hover(function(e) {
        Spyhook.record('hovered-on-a-foobar', {data: { event: e }, keys { magic: true } }); // We'll increment our count of hovered-on-a-foobar, as well as add an event, and wing along the opts to store them too!
      });
    </script>

We can also do it on the server-side! (In this case, in Ruby)

    require 'net/http'
    require 'json'

    req = Net::HTTP::Post.new('/spy', initheader = {'Content-Type' =>'application/json'})
    req.body = [{
      event: 'foobar'
    },{
      event: 'bazzle'
    }].to_json
    Net::HTTP.new('spyhook.example.local', 80).start {|http| http.request(req) }

You get the idea. All that jazz on the clients? Happens asynchronously. Requests get batched up too. Server-side? It's a simple node.js daemon that proxies through to your choice of backend. Initially, we're using it to pipe to MongoDB.

Quickstart
----------

You'll need a MongoDB server running - you can specify the host and port with the environment variables MONGO_NODE_DRIVER_HOST and MONGO_NODE_DRIVER_PORT. Defaults are localhost:27017.

    $ npm install
    $ node server.js

Point a browser to http://localhost:1337/tail, and then another browser to http://localhost:1337/test. You'll see events come through on the tail!

Schema
------

Spyhook thinks in documents. Events are wrapped up in a fairly simple schema, which is then indexed appropriately at the server level. At this time, the schema will likely change - I'd recommend using the JS library until we hit 1.0.

    {
      event: 'Event Name',
      keys: {
        user_id: 'An example user id or session',
        color: 'Purple',
        ts: 'The timestamp of when the event happened on the client side.'
      },
      data: {
        extra_info: 'There might be some extra information here about the event.',
        even_more: 'Keys in the data section won\'t be indexed for querying.'
      }
    }

Performance note: Anything you put into the "keys" sections will add an index. Be careful having too many keys here.

Example Queries
---------------

These are some example Mongo queries that you might use against a Spyhook database.

Get all the page visits a given user has made:

    db.spyhook.events.find({'keys.user_id': 'an example user', 'event':'visit'})

FAQ's
-----

_What about security? Can't anyone spoof an event and throw my metrics off?_
Unfortunately, yes. I don't have an easy solution to this, since we can't trust clients, but they're providing the metric info. The solution, for now, is to fire metric events server-side.

Todo
----

 * Minify up the client lib automagically.
 * Support running events through a queue.
 * Use an offset for server time vs. client time.
