# Moncroffe

[Boxel collect thing](http://www.mrspeaker.net/dev/game/moncroffe) by [Mr Speaker](http://twitter.com/mrspeaker).

Find the mysterious boxes... the evil clowns know where they are. Shoot them to find the way.
Now with Oculus Rift support!


	Mouse: look
	Keys/WSAD: move
	Left click: Add block if close, else shoot
	Right click (or shift left): Remove block
	Wheel: Change block

	't': Chat
	'1/2': Adjust mouse sensitivity
	'e': Toggle Oculus Rift mode (no head tracking yet)
	'3': Reset headset in VR mode
	'4': Toggle Ambient Occlusion (debugging)

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

## Next todos

- players names on screen
- Explain goal in titlescreen
- disconnect-y screen instead of pointerlock
- leaderboard (session)

## Bugz

- omg... multiplayer, you can't jump as high...
  ... need to switch to fixed timestep for physics.

> client

- Hit head slide down (and can get stuck in block)
- Camera goes through block when close, looking on angle
- Block & face selection wrong when close to blocks
- Bullet gets stuck when firing close to block
- Weird CSS display issue "ROUND OVER" with background, isntead of "got box"

> server

- Client refresh loses session info
- Client background tab accumulates evil clowns
- Block add/remove not synced
- escape html in innerHTML calls
- server game keeps running even when no clients

> other

- VR head tracking doesn't aim gun
- VR Should walk in direction looking

## Needs

- Greedy meshing. Currently had basic face-culling only.
- Block-based lighting
- Shift-walk for overhang picking?
- Camera pitch/yaw not same as minecraft when looking up/down
- Leaderboard (global)

## Would be cool/maybes

- Create levels that others can play
- Some indestructible/special blocks
- Choose "just you" or "everyone" for add/remove blocks
  - make tunnels just for you, baracades against everyone etc

- Some reason clown particles get attracted to cube (theme)
- The more you destroy clowns, the more coins the block sucks, greater the blocks value becomes. if people can't find it, it's value will rise

- Health level on player, colour desaturates - easier to hide when nearly dead

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

## Good seeds

9696309
25301249

