Moncroffe

Minecraft style boxel demo... by Mr Speaker

# bugz
- lights need to be set to update when toggling day/night
- can add block in position currently standing
- hit head slide down (and can get stuck in block)
- camera looks through block when looking straight down
- block & face selection wrong when close to blocks

# perf
- no meshing - all blocks added, remesh is super slow
- load meshes in webworker? At least "staggered"

# needs
- block-based lighting
- shift-walk for overhang picking

# todolol
- separate data and logic
- move world details out of main
- move the cursor stuff out of main
- clean up pointer lock and player controls
- camera pitch/yaw not same as minecraft when looking up/down
- add "horizon" to day time


# cube geom

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
