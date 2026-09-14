# Third-party motion and model rendering

Reviewed on 2026-09-08. Only animation/rendering utilities are integrated. No third-party page designs, copy, logos, project photos or video footage have been copied.

| Project                                                          | Pinned version                                    | Used for                                                           | License                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [GSAP](https://github.com/greensock/GSAP)                        | 3.15.0                                            | ScrollTrigger horizontal chapters, parallax and content reveal     | [GSAP Standard no-charge license](https://gsap.com/standard-license/); permits commercial websites, not MIT |
| [Lenis](https://github.com/darkroomengineering/lenis)            | 1.3.26                                            | Desktop smooth scrolling coordinated with GSAP ticker              | MIT; `public/licenses/lenis.txt`                                                                            |
| [Embla Carousel](https://github.com/davidjerleke/embla-carousel) | 8.6.0                                             | Retained carousel primitive dependency; home gallery is now custom | MIT; `public/licenses/embla.txt`                                                                            |
| [Three.js](https://github.com/mrdoob/three.js)                   | 0.185.1                                           | On-demand product GLB rendering in the showroom                    | MIT; `public/licenses/three.txt`                                                                            |
| [Google Draco](https://github.com/google/draco)                  | Decoder assets retained from the original project | Local GLB mesh decoding without external CDN requests              | Apache-2.0; `public/licenses/draco.txt`                                                                     |

GSAP copyright: © 2008–2026 GreenSock. Standard license and use restrictions remain applicable; this is an end-user industrial brand website, not a competing animation builder. Package copyright headers are retained by the build.

## Visual research only

[ReactBits CircularGallery](https://github.com/DavidHDev/react-bits) was evaluated for arc motion. Its source was **not** copied and the library is **not** installed. The gallery here uses original DOM card transforms, GSAP ScrollTrigger and scoped pointer handlers, without private Embla APIs, OGL, copied shaders or a global wheel handler. Its MIT + Commons Clause license is therefore not a license of this site's implementation.

DesignTim reference videos were viewed only for motion direction: continuity of a subject across scenes, smooth perspective changes, and scroll-linked transitions. Their video files, website layouts and art are not distributed in this repository.

Framework and UI foundation: Sites scaffold, Vinext/React, Base UI and shadcn. Their installed dependency notices remain in their packages; untouched supplied components are retained. Original FlyDeer public assets and their rights remain with their respective owners, and are not relicensed by these software notices.

## FRS POWER identity and delivery sequence

The FRS POWER logo is supplied by the user. Factory/product photographs and the other product models come from the existing authorized company asset library. On 2026-09-10, the standard open-frame generator (`open-frame-small`) was replaced with the user-provided `发电机组_四视图细节优化.blend`; its evaluated geometry and materials are used for the compressed GLB, product orbit film, story keyframes and refreshed delivery sequence. The original Blender source is preserved separately. The crane rig, loading platform, shipping container, truck, camera animation and rendered WebP sequences were newly created for this website in Blender. No reference-site models, frames, textures or runtime code are included. Editable Blender scenes and render scripts are retained separately from the public website.

## User-provided company brochure

`public/media/brochure/container.webp` is cropped from the containerized product rendering on PDF spread11 (printed17–18). `manufacturing.webp` is extracted from an embedded workshop photo on PDF spread6 (printed07–08). Source: user-provided《FORIS-POWER发电机组画册-福州.pdf》, reused for this company website as requested. These assets retain their original rights; this document does not relicense them. `lib/brochure.ts` contains supported bilingual summaries and `lib/brochure-models.json` contains383 source-attributed configurations after withholding10 inconsistent rows. Full extraction and image manifest are retained in the separate delivery folder. The container rendering is identified as a brochure image, not an actual project delivery photograph.
