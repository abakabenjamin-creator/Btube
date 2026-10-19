#!/usr/bin/env bash
# Downloads HeyGen renders (A-roll = Avatar V). Needs files2.heygen.ai + resource2.heygen.ai allowed in the environment's network settings.
# A-roll links are signed and expire ~2026-10-26; after that, refresh them with get_video.
set -euo pipefail
cd "$(dirname "$0")/../assets"; mkdir -p broll_src
F=https://files2.heygen.ai/aws_pacific/avatar_tmp/76098285058a491b856295e2a9522ec4
R=https://resource2.heygen.ai/videos/76098285058a491b856295e2a9522ec4/76098285058a491b856295e2a9522ec4
curl -fsSL -o part1.mp4 "$F/d5a78476036e5b1c99c040e887d3a356.mp4?Expires=1792988714&Signature=lBN6vSDILh4-97XIczborX4-b0sQYQaahCe4uVrhWNa~DKDJt7rTaIyc5WSu~sgdlJ3avaUwE~6DVvSYMBuTUSzX1x8S6K8ajFDK26JKumjiZ6j~Yg8Za4PGN-yrGwdDKLIMVf6ZwMNTDTjNS2YK3jWwB-vXoCB2TgNHM~xO0mvZKcn2NAL~QM0BmVSFXTcS5-KAS7X3xZTsE8sLBkGWzN6~FM29dI1mikjjDkbNTYc4tkgoIaDcyXNBRnn0EsiNcCv~oUGf~zK7j9aZchKC1hdJDRLQ99uPf7Q5~W-qHvRCOvPu54mBAbk4tsr-ARnc5AqmitJMo8dRX8KzbK8S6g__&Key-Pair-Id=K38HBHX5LX3X2H"
curl -fsSL -o part1.srt "$F/subtitles_d5a78476036e5b1c99c040e887d3a356.srt?Expires=1792988829&Signature=i~Ki165jXxLx-v37oJ-5SPtnX6BVPIVkbZNFasZcD~RvXc1nFF2RzHPYCa40DDGFK1t2JbnCBB351G55UkMCdeXk8jCChmII3uP2~XwHvYd-PmNSJ9N0AsB-Paco-dXvzqCWWM7K3r9Dda8pcDfAPPzZ9~F49z7iq7SuaNZ9-BD3byUhknlEO9l2F0UyWECtW9a~TRB7xrETm-1GSKRKpBEp~xhn-YuwQvPmtMcLHADji1~O454yLhubAzR~JObascSPckqSuLWFP5JM1iwkKrTj~5Uis6kMG9MS6FDck3hV1PYPpEu2fvE~fUn1LiHz0Dw2Xn12iemSsb0LZ5u7uw__&Key-Pair-Id=K38HBHX5LX3X2H"
curl -fsSL -o part2.mp4 "$F/4a85b4328b0dc2ec5a2bdc11463e7fe9.mp4?Expires=1792988714&Signature=ZiCY9gWzaEnCgZpyZNIBPAjWu9lHSYaljUqSuW6Tc1N3E7RjTYls26ChFwMHqRUE1EqUGmNg7~MMr1DBGP0VmUw5qmEGpmwx2dZzyaTBozOHpXxil2f0wX~f9eQSU1vMNPC3xWkjTXmjlitfIeVKHXb1FR3cnveHYuf23N0j1zOTlxC9Vn7CJ5MAH6z3~ANt8JlLuBQUSvp8CpPRtiH32ZQiOok31LhK4w6w0TkhREsY7gaNuMvkLH3Z22Lqhbku3ji6V~O4f5PlkIizYxrlsV98-YYmMCqWM3H8RnYkpk4Ggpd2bM5uvHj65bZrX89l~iFVZlEypLqKeBVLkJ7Usw__&Key-Pair-Id=K38HBHX5LX3X2H"
curl -fsSL -o part2.srt "$F/subtitles_4a85b4328b0dc2ec5a2bdc11463e7fe9.srt?Expires=1792989101&Signature=jx6wWVUnbHOCoW~DMooKI8uyB3LrxG5obJ8um2oO4QzNeoEIS11gKYRRGrWixEMlPOnNAsdrQh1d-EIucy-zW8iLc2tAALs5jw3ftzgheQ4aWjkIhSg9puZ3HQwfokiPXxWjhwTJUbteAW5LbYcBjOEtVkw8F2ODWerlWXfBWP9kvjumgoU8Fp~T17Ozd5dSx5DRKEBYNLRiUtPw12venLXeusxjvMDn81J5yrH2Rb28~5wLbcLl465h8st2y3J61AmcWdWMSVdP05PC9tHLfVJPtE~00gpaP9IueCwcbcwTW6z1h2OyGMBog-P5lNgeWs-RqOg7S-DGLZ3OoiBu6A__&Key-Pair-Id=K38HBHX5LX3X2H"
curl -fsSL -o broll_src/b_water.mp4   "$R/01a1525b-0b42-768e-995e-88bb4b238d2d.mp4"
curl -fsSL -o broll_src/b_beach.mp4   "$R/01a1525b-2e03-7448-8abc-bb4abcc564f4.mp4"
curl -fsSL -o broll_src/b_garden.mp4  "$R/01a1525b-31e3-7d4e-bf43-81b85d0f3f04.mp4"
curl -fsSL -o broll_src/b_bike.mp4    "$R/01a1525b-9f24-7066-aee4-39fa8281513d.mp4"
curl -fsSL -o broll_src/b_skyline.mp4 "$R/01a1525b-aae5-7955-a416-07da0f367c57.mp4"
curl -fsSL -o broll_src/b_car.mp4     "$R/01a1525b-f552-7462-90f9-942872d66ec0.mp4"
echo fetched
