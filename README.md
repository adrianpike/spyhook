Spyhook
=======

Have you ever really wished you could just _measure things_ in your webapps? To not think about what the backend looks like, how you query the data, or if it's going to cost you in performance?

I have. The "winningest" solution I've used so far was to use Google Analytics, but:
 - You can't use it from your server code.
 - It can be easily messed around with client-side.
 - Building complex queries off it can be a royal pain, and often requires adjusting how you measure things.
 - Scoping things per-user is a royal pain^2.

Enter Spyhook. Let's record some events on the client.

    <script type="text/javascript" src="https://spyhook.example.local/spyhook.js"></script>
    <script type="text/javascript">
      Spyhook.user_id('SESSION_KEY'); // Optional, of course.
    </script>

    <script type="text/javascript">
      $('a').click(function(e) {
        Spyhook.record('clicked-on-something'); // We'll increment our count of clicked-on-something, as well as an event for that user session key (if we provided one!)
      });
      $('#foobar').hover(function(e) {
        Spyhook.record('hovered-on-a-foobar', {event: e, magic: true}); // We'll increment our count of hovered-on-a-foobar, as well as add an event, and wing along the opts to store them too!
      });
    </script>

Let's also do it in Ruby!

    require 'spyhook'
    Spyhook.authenticate(MY_SUPER_SECRET_KEY)
    Spyhook.user_id(session[:id].munge)
    Spyhook.record('performed_magic')

You get the idea. All that jazz on the clients? Happens asynchronously. Requests get batched up too. Server-side? It's a simple node.js daemon that proxies through to your choice of backend.

Want to try it out? Too bad, it's not released yet. RDD, baby.
No, really want to try it out? Tweet me @adrianpike and I'll hustle it along. :)

PS: Chuck me a pull request if you want to see something else, I'm all ears.