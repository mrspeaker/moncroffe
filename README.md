# Moncroffe

[Boxel collect thing](http://www.mrspeaker.net/dev/game/moncroffe) by [Mr Speaker](http://twitter.com/mrspeaker).

Find the mysterious boxes... the evil clowns know where they are. Shoot them to find the way.
Now with Oculus Rift support!


	Keys/WSAD: move
	Left click: Shoot / Add block
	Right click (or shift left): Remove block
	Mouse: Look

	't': Chat
	'1/2': Adjust mouse sensitivity

	'e': Toggle Oculus Rift mode

	'3': Invert mouse pitch
	'4': Toggle Ambient Occlusion (debugging)
	'5': Reset headset in VR mode

	Wheel: Change block to add

Query params /:

	third=true : use third person camera (static at the moment)

	> console.log(main.screen.world.seed) : see current seed

	> main.makeAzerty(); // If you want ZQSD instead of WASD

	> window.Network or main.screen.world... if you feelin' cheat-y
	(Next version will be driven by server, but this is just hacked together for fun)

Running:

	> cd svr
	> node index.js

	game served on port 3001

	Sometimes I'm running a server at: 162.243.121.239:3001

## Next todos

- leaderboard (session)
- resize with correct aspect
- choose player tint color

## Bugz

- omg... multiplayer, you can't jump as high...
  ... need to switch to fixed timestep for physics.

> client

- Bullet gets stuck when firing close to block
- collision bug - jumps like crazy. To reproduce:

    walk -> []
         []___

- Chunks assume only one Y chunk (chId = "x:z")

> server

- Can get stuck in "born" state (close puter while game is playing)
- Block add/remove not synced
- escape html in innerHTML calls
- game should run in "offline mode"?

> other

- Sounds of other players
- sound for player disconnect
- VR head tracking doesn't aim gun
- VR Should walk in direction looking


## Needs

- Greedy meshing. Currently had basic face-culling only.
- Leaderboard (global)

## Would be cool/maybes

- Create levels that others can play
- Some indestructible/special blocks
- Choose "just you" or "everyone" for add/remove blocks
  - make tunnels just for you, baracades against everyone etc

### Theme

- Some reason clown particles get attracted to cube
- The more you destroy clowns, the more coins the block sucks, greater the blocks value becomes. if people can't find it, it's value will rise?

## Cube geometry notes

	  6---7
	 /|  /|
	2---3 |
	| 4-|-5
	|/  |/
	0---1

Sides:

	2---3  3---7  7---6  6---2
	|   |  |   |  |   |  |   |
	|   |  |   |  |   |  |   |
	0---1  1---5  5---4  4---0

Bottom/Top:

	0---1  6---7
	|   |  |   |
	|   |  |   |
	4---5  2---3

Quads/Triangles (counter-clockwise) order:

	2---3                3         2---3
	|   |  becomes      /|   and   |  /
	|   |             /  |         |/
	0---1            0---1         0

Triangles: 0-1-3 and 0-3-2
Quad: 0-1-3-2

Face order: Front, Left, Back, Right, Bottom, Top

