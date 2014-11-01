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
