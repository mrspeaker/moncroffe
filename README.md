# Moncroffe

[Minecraft style boxel demo](http://www.mrspeaker.net/dev/game/moncroff) by [Mr Speaker](http://twitter.com/mrspeaker).

Now with Oculus Rift support!

	Mouse: look
	Keys/WSAD: move
	Left click: add block if close, else shoot
	Right click: remove block
	Wheel: change block

	'e': toggle Oculus Rift mode
	'q': toggle Ambient Occlusion

## bugz

- neighbour chunk needs to be re-meshed when exposed (face missing)
- can add block in position currently standing
- hit head slide down (and can get stuck in block)
- camera looks through block when looking straight down
- block & face selection wrong when close to blocks

## perf

- no meshing - naive face-culling only.

## needs

- block-based lighting
- shift-walk for overhang picking

## todolol

- separate data and logic
- move world details out of main
- move the cursor stuff out of main
- clean up pointer lock and player controls
- camera pitch/yaw not same as minecraft when looking up/down

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
