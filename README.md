Moncroffe

Minecraft style boxel demo... by Mr Speaker

# bugz
- can add block in position currently standing
- can't have "negative" chunks
- hit head slide down (and can get stuck in block)
- camera looks through block when looking straight down
- ray misses default to 0,0
- clicking at air while moving causes jumping - if out of world, crash.
	- because of ray misses!
- block/face selection weird when very close to blocks

# perf
- re-mesh (when add/remove block) is super slow
- no meshing - all blocks added
- load meshes in webworker

# needs
- ambient occlusion
- shift-walk for overhang picking

# todolol
- chunk handling is super hacked in there... clean it up!
- move world details out of main
- clean up pointer lock and player controls
