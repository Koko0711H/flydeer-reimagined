# 福瑞斯 / FRS POWER

The supplied red logo and authorized generator/factory media are the brand authority. Original shenchai-main remains untouched. The homepage is a continuous cinematic journey, as clarified by the user after the first standalone delivery-section implementation.

## Visual direction

Apple-like clarity and a generator’s journey from manufacturing to a working site. Large products, generous negative space, precise type. The moving object participates in page composition and changes position, scale, angle and environment across chapters. No detached miniature display stage.

White/light gray #F5F5F7, charcoal #18191B, ink #1D1D1F, original logo red #EC0016 and legible red #C70018. Helvetica Neue / PingFang SC / system sans. Display 600, tracking -0.035em, normal body 16px. Product selection is a simple ruled list; controls remain semantic DOM.

## Eight connected shots

| Chapter    | Content                                                                | Spatial transition                                                                                   |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| start      | FRS identity and generator                                             | Large machine alongside the title; follows the scroll into product space                             |
| products   | Five types, brochure-backed ranges, film, detail, catalog and 3D links | Same open-frame generator moves right; selection stays in an independent left panel                  |
| company    | Fabrication, assembly, checks                                          | Machine lifts on the right; manufacturing copy stays left against dim factory photography            |
| showroom   | Configuration, maintenance, integration                                | Camera rotates frontward; factory recedes and clear product space returns                            |
| delivery   | Transport, positioning, installation                                   | Rig releases, generator enters container; dark lower plane becomes the next page boundary            |
| industries | Four selectable industries                                             | Complete truck travels along the light/dark boundary, then camera rises to a top view                |
| cases      | Seven applications, selector and details                               | Camera rises with the truck visible on the right while a site photograph fills the viewport          |
| contact    | Inquiry and original phone                                             | Site view shrinks toward the upper right, becomes actual delivery imagery; red FRS typography closes |

One native sticky visual stage belongs to the entire homepage. Eight semantic sections each occupy 160svh; their content uses readable holds and fades while the shared object crosses between them. Stage coordinates, sequence frame, backgrounds and active navigation derive from the same absolute scroll value. Source frames do not drive scroll. No accumulated on-enter timeline state.

## Navigation and access

Header links go to actual home chapter anchors; full catalog, about, showroom, cases, news and service remain directly accessible within chapters and footer. This is continuity across homepage chapters, not a claim of uninterrupted Canvas lifetime across a full document navigation. Mobile has its own object placement and text layout. Short screens and reduced motion use normal-flow content plus meaningful stills. Without JavaScript the document is readable. Hidden shots do not intercept pointer clicks; keyboard focus reveals content.

## Runtime and truth

Original generator GLB, newly authored crane/container/truck, one430-frame transparent WebP sequence sampled at thirds of the original144-frame timeline. Frames1–330 extend the original1000×714 image upward by2200px to preserve the entire lifting rig; frames331–430 retain their original geometry. Align both formats to the same base image origin, with no actor-level paint clipping. Only the viewport bounds the stage. The decoded window is pixel-budgeted (currently desktop±3; mobile±2 at640px width); at most3 concurrent downloads and2 decodes. Encoded blobs stay cached; eviction and unmount close bitmaps. Actor position and source-frame progression use continuous-velocity monotone cubic interpolation. Render one nearest integer frame at full opacity after each canvas clear, during both movement and rest. Never blend different mechanical poses or schedule delayed sharpening. Camera transforms remain continuous. Copy remains in its viewport lane through its reading hold and fades. Reverse scrolling and section jumps are seekable. Keep static assets and original videos as accessible alternatives.

No invented customer projects, certifications or performance promises. Original contact values, including email spelling, are retained. Application images illustrate settings. Inquiry creates a local email draft; nothing is sent by the website. Local preview only. Preserve editable Blender and reproduction source; clean disposable task files after validation.

## Brochure-led refinement

Company, manufacturing, configuration and service copy comes from the supplied 26-spread brochure. Retain FRS POWER branding and supplied logo red. The product catalog is a ruled, horizontally contained specifications table with brand/frequency/search controls and source page references. Keep engineering details on the product route, with a direct entry from the homepage product chapter. Two extracted brochure images support manufacturing and containerized power. Do not publish conflicted company history, scale, certification validity or contact replacements without user resolution.
