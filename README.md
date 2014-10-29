Moncroffe

Minecraft style boxel demo... by Mr Speaker

# bugz
- can add block in position currently standing
- hit head slide down (and can get stuck in block)
- camera looks through block when looking straight down
- block/face selection weird when very close to blocks

# perf
- re-mesh (when add/remove block) is super slow
- no meshing - all blocks added
- load meshes in webworker

# needs
- block-based lighting
- ambient occlusion
- shift-walk for overhang picking

# todolol
- chunk handling is super hacked in there... clean it up!
	- separate "world logic" and "world data"
	- separate "chunk logic" and "chunk data"
- move world details out of main
- move the cursor stuff out of main
- clean up pointer lock and player controls
- camera pitch/yaw not same as minecraft when looking up/down
- add "horizon" to day time
