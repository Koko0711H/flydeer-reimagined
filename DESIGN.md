# 福瑞斯 / FRS POWER

The supplied red logo and authorized generator/factory media are the brand authority. Original shenchai-main remains untouched. The homepage is a continuous cinematic journey, as clarified by the user after the first standalone delivery-section implementation.

## Visual direction

Apple-like clarity and a generator’s journey from manufacturing to a working site. Large products, generous negative space, precise type. The moving object participates in page composition and changes position, scale, angle and environment across chapters. No detached miniature display stage.

White/light gray #F5F5F7, charcoal #18191B, ink #1D1D1F, original logo red #EC0016 and legible red #C70018. Helvetica Neue / PingFang SC / system sans. Display 600, tracking -0.035em, normal body 16px. Product selection is a simple ruled list; controls remain semantic DOM.

## Eight connected shots

| Chapter    | Content                                                                | Spatial transition                                                                                   |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| start      | FRS identity and generator                                             | Large machine alongside the title; follows the scroll into product space                             |
| products   | Three generator families, brochure-backed ranges, detail, catalog and 3D links | Selected open, silent or container generator moves right; selection controls the entire following journey                  |
| company    | Fabrication, assembly, checks                                          | Machine lifts on the right; manufacturing copy stays left against dim factory photography            |
| showroom   | Configuration, maintenance, integration                                | Camera rotates frontward; factory recedes and clear product space returns                            |
| delivery   | Transport, positioning, installation                                   | Silent/open set enters the transport container; containerized set is lowered directly onto the truck deck            |
| industries | Four selectable industries                                             | Complete truck travels along the light/dark boundary, then camera rises to a top view                |
| cases      | Seven applications, selector and details                               | Camera rises with the truck visible on the right while a site photograph fills the viewport          |
| contact    | Inquiry and original phone                                             | Site view shrinks toward the upper right, becomes actual delivery imagery; red FRS typography closes |

One native sticky visual stage belongs to the entire homepage. Eight semantic sections each occupy 160svh; their content uses readable holds and fades while the shared object crosses between them. Stage coordinates, sequence frame, backgrounds and active navigation derive from the same absolute scroll value. Source frames do not drive scroll. No accumulated on-enter timeline state.

## Navigation and access

Header links go to actual home chapter anchors; full catalog, about, showroom, cases, news and service remain directly accessible within chapters and footer. This is continuity across homepage chapters, not a claim of uninterrupted Canvas lifetime across a full document navigation. Mobile has its own object placement and text layout. Short screens and reduced motion use normal-flow content plus meaningful stills. Without JavaScript the document is readable. Hidden shots do not intercept pointer clicks; keyboard focus reveals content.

## Runtime and truth

User-provided refined generator, newly authored crane/container/truck, three product-specific 430-frame transparent WebP sequences sampled at thirds of the original 144-frame timeline. Version 6 renders the complete visible assembly into a tight native crop with a longest edge around 1600 pixels. Per-frame crop coordinates and native dimensions map into a virtual 1000×714 canvas. Never mix cropped assets with full-image metadata. Preserve the editable source and original physical animation.

Desktop framing follows a continuous camera in physical coordinates and compensates the safety camera embedded in each rendered bitmap. Decoder completion must not independently change the product's screen scale. Scroll updates the player target directly; nearby ready poses may approach it without overshooting or recoiling. A distant seek waits for a nearby target bitmap instead of replaying every missed pose. Do not gate every camera update on one exact decoded frame or impose a separate catch-up speed limit. A viewport-safe envelope contains nearby mechanical poses, including reverse seeks and resize. The actor has no paint clipping.

The source camera spans are the visual scale reference. Plan one complete camera path per viewport: anticipate the arriving truck, pull back monotonically through lifting and insertion, then gently approach the departing truck. Limit log-scale change to 0.012 per dense frame and plan translation before equipment enters. Never refit the combined truck and generator to the same width used for the generator alone. Details fade before the moving machine reaches the text; the section title remains through the transition.

Decoded images share a 100 MiB desktop / 24 MiB mobile budget, including a retained displayed pose and pending decoders. Up to 3 downloads and 2 decodes run concurrently; encoded blobs are reused. Desktop uses native images up to 2000 pixels long, mobile up to 960. Idle presentation does not repeatedly paint. Clear the canvas and draw one nearest integer frame at full opacity. Never blend different mechanical poses, add motion blur, or delay sharpening until scrolling ends. Same-pose whole-assembly entry and departure fades preserve mechanical continuity. Selected-product static keyframes and on-demand 3D details remain accessible alternatives.

No invented customer projects, certifications or performance promises. Original contact values, including email spelling, are retained. Application images illustrate settings. Inquiry creates a local email draft; nothing is sent by the website. Local preview only. Preserve editable Blender and reproduction source; clean disposable task files after validation.

## Brochure-led refinement

Company, manufacturing, configuration and service copy comes from the supplied 26-spread brochure. Retain FRS POWER branding and supplied logo red. The product catalog is a ruled, horizontally contained specifications table with brand/frequency/search controls and source page references. Keep engineering details on the product route, with a direct entry from the homepage product chapter. Two extracted brochure images support manufacturing and containerized power. Do not publish conflicted company history, scale, certification validity or contact replacements without user resolution.

## Product selection continuity

Use exactly three choices in the homepage, showroom, product catalog and inquiry: open-frame, silent and containerized. One selected product ID drives copy, frame package, static alternatives, model links and the following delivery choreography. Selection changes neither scroll position nor chapter lengths. Keep the current choice through chapter navigation, reverse scrolling, language changes and returning from a product detail or showroom route. Rapid selection cancels old work and can never commit an obsolete model. Do not load or decode three complete sequences concurrently.

Preserve the two user-supplied red enclosure models, including locks, louvers, corner castings and exhaust equipment. Lift the containerized set as a complete unit onto a bare truck deck; never put it inside a second enclosure. Reconnect lifting gear to the actual supplied geometry. Use the same crisp single-pose rendering and continuous physical camera rules as the refined open generator.

The container variant reserves the left 53% for copy through the first three chapters. The camera planner releases this constraint smoothly between story values 3.3 and 3.6, using the same bounded scale and pan envelopes. This is a layout constraint on the selected camera track, not a change to product geometry or the open-set composition.
