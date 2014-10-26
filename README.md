Moncroffe

Minecraft style boxel demo... by Mr Speaker

# bugz

- can't have "negative" chunks
- placing block on face in next chunk fails (pos + face changes chunks)
- hit head slide down (and can get stuck in block)
- camera looks through block when looking straight down

# perf
- re-mesh (when add/remove block) is super slow
- no meshing - all blocks added
- load meshes in webworker

# needs
- ambient occlusion