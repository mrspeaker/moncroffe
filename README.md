# Moncroffe

[Minecraft style boxel demo](http://www.mrspeaker.net/dev/game/moncroffe) by [Mr Speaker](http://twitter.com/mrspeaker).

Now with Oculus Rift support!

	Mouse: look
	Keys/WSAD: move
	Left click: add block if close, else shoot
	Right click (or shift left): remove block
	Wheel: change block

	'1/2': adjust mouse sensitivity
	'e': toggle Oculus Rift mode (no head tracking yet)
	'q': toggle Ambient Occlusion

Query params:

	seed=1234 : use 1234 as generation seed
	third=true : use third person camera (static at the moment)

	> console.log(main.world.seed) : see current seed

## Bugz

- Neighbour chunks needs to be re-meshed when exposed (face missing)
- Can add block in position currently standing
- Hit head slide down (and can get stuck in block)
- Camera goes through block when close, looking on angle
- Block & face selection wrong when close to blocks
- Bullet gets stuck when firing close to block
- VR head tracking doesn't aim gun
- Should walk in direction looking
- Move world logic from main to worldscreen

## Needs

- Freedy meshing. Currently had basic face-culling only.
- Block-based lighting
- Shift-walk for overhang picking
- Camera pitch/yaw not same as minecraft when looking up/down
- Seeded random for block types

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
