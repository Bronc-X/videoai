# Shark Costume Beach Test Run

## Test Goal

Use the product-locked workflow to generate a simple beach comedy video for the blue inflatable shark costume.

This test belongs to the wearable inflatable costume category. The category-level lock from `docs/product-video-workflow.md` applies before the shark-specific Product Lock Card.

Priority:

1. Product accuracy
2. Interesting motion
3. Beach scene richness
4. Longer duration

## 1. Product Image Upload

### Uploaded Product Images

- `C:/Users/Administrator/Desktop/[video-test]/1.png`
- `C:/Users/Administrator/Desktop/[video-test]/2.png`
- `C:/Users/Administrator/Desktop/[video-test]/3.jpg`

### Product Image Roles

- `1.png`: front view, authoritative for white belly panel, zipper, transparent face-viewing window, front fin positions, shoes
- `2.png`: side view, authoritative for orange fan valve, black eye, black gill stripes, side fin, back fin, side profile
- `3.jpg`: back view, authoritative for back fin, rear body shape, tail/back structure, rear seams

## 2. Product Lock Card

```json
{
  "product_label": "Blue inflatable shark costume",
  "category": "wearable_inflatable_costume",
  "costume_type": "shark",
  "category_lock": [
    "must remain a wearable inflatable costume",
    "must not become a real shark",
    "must not become a cartoon shark",
    "must not become a plush toy",
    "must not become a CGI creature",
    "must preserve inflated fabric, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes"
  ],
  "authoritative_views": {
    "front": "C:/Users/Administrator/Desktop/[video-test]/1.png",
    "side": "C:/Users/Administrator/Desktop/[video-test]/2.png",
    "back": "C:/Users/Administrator/Desktop/[video-test]/3.jpg"
  },
  "main_identity": [
    "wearable inflatable shark costume",
    "bright blue inflatable body",
    "large white belly panel",
    "black round side eye",
    "black curved gill stripes",
    "side fins",
    "back fin and tail/back shape",
    "black shoes visible at bottom"
  ],
  "critical_lock_points": [
    {
      "name": "blue transparent PVC face-viewing window",
      "location": "upper front white belly panel",
      "rules": [
        "must remain a blue-tinted transparent vinyl window",
        "must keep shiny reflections and cross seam/reflection lines",
        "must not become a mouth",
        "must not become teeth",
        "must not become a logo, patch, or eye"
      ]
    },
    {
      "name": "orange circular fan valve",
      "location": "wearer's left side torso/waist, below side fin root and above hip area",
      "rules": [
        "must remain small, flat, circular, orange",
        "must stay fixed in the same side torso/waist position",
        "must not move to front belly, chest, back center, fin, tail, or legs",
        "must not be enlarged, duplicated, hidden, recolored, or reshaped"
      ]
    },
    {
      "name": "back fin and tail/back structure",
      "location": "rear body",
      "rules": [
        "must not split into extra fins",
        "must not change into a fish tail",
        "must not disappear or duplicate"
      ]
    }
  ],
  "preferred_video_angle": "three-quarter side angle that keeps the transparent front window and orange side fan valve visible",
  "motion_budget": {
    "mode": "high_accuracy",
    "max_rotation_degrees": 8,
    "allowed_actions": [
      "gentle inflatable bounce",
      "small fin lift",
      "small proud nod",
      "tiny one-step shuffle"
    ],
    "forbidden_actions": [
      "turn around",
      "spin",
      "jump",
      "walk far",
      "wild dance",
      "reveal unseen angles"
    ]
  },
  "status": "pending_user_confirmation"
}
```

## 3. Required User Confirmation

Before first-frame generation, ask:

```text
Please confirm the shark costume lock points:

0. This is a wearable inflatable costume, not a real shark or mascot. Confirm?
1. Is the transparent blue PVC face-viewing window on the upper white belly panel a critical lock point?
2. Is the orange circular fan valve on the side torso/waist a critical lock point?
3. Is the back fin and tail/back structure a critical lock point?
4. Is the preferred video angle a three-quarter side angle where both the front window and side fan valve remain visible?
5. Are there any missing lock points?
```

Expected confirmation for this test:

```text
Approved. The transparent window, orange fan valve, side gill stripes, back fin, tail/back shape, zipper, wrinkles, seams, and black shoes are all critical.
```

## 4. First-Frame Generation

### First-Frame Scene

The shark costume is placed in a beach comedy setup. The product remains the hero.

Recommended scene:

```text
A sunny beach snack stand or lemonade stand. Sand, ocean, a small beach umbrella, towels, a cooler, and one amused beachgoer in the background. The shark costume acts like a serious beach support manager.
```

### First-Frame Prompt

```text
Use the provided product images as exact product references.

Create one realistic vertical 9:16 first-frame image for later image-to-video generation.

Product lock:
Preserve the same wearable inflatable shark costume exactly. Do not redesign, simplify, replace, recolor, or reinterpret the product.

Category lock:
This is a wearable inflatable costume. It must not become a real shark, cartoon shark, plush toy, CGI creature, or redesigned mascot. Preserve the inflated nylon/plastic fabric, air-filled volume, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes.

Must preserve:
- bright blue inflatable body
- large white front belly panel
- vertical zipper line
- blue transparent PVC face-viewing window on the upper white belly panel
- black round side eye
- black curved gill stripes
- side fins with white underside
- back fin and tail/back structure
- orange circular fan valve on the wearer's left side torso/waist
- black shoes
- fabric wrinkles, seams, folds, and inflatable material

Critical details:
The blue transparent PVC face-viewing window must stay on the upper front white belly panel. It must look like a blue-tinted transparent vinyl window with shiny reflections and cross seam/reflection lines. It is not a mouth, not teeth, not a logo, not a patch, and not an eye.

The orange circular fan valve must stay small, flat, circular, orange, and located on the side torso/waist below the side fin root and above the hip. Do not move it to the front belly, chest, back center, fin, tail, or legs.

Scene:
A sunny beach snack stand with sand, ocean, a beach umbrella, towels, and a cooler. A beachgoer in the background looks amused. The costume is acting like a serious beach support manager.

Composition:
Vertical 9:16. Full body visible. Use a three-quarter side angle that keeps both the front transparent window and orange side fan valve visible. Do not crop head, fins, fan valve, transparent window, zipper, tail, or shoes.

Style:
Realistic commercial product image, clean lighting, sharp product detail.

Avoid:
No mouth, no red mouth, no teeth, no shark jaw, no new face opening, no human face visibility, no moved fan valve, no missing transparent window, no redesigned costume, no extra logos, no readable text, no subtitles, no hats, no sunglasses, no accessories, no cartoon, no real shark, no plush toy, no mascot redesign, no morphing, no transformation, no body deformation.
```

## 5. First-Frame Review

The user or reviewer must approve the first frame.

Checklist:

- [ ] Transparent PVC face-viewing window is correct
- [ ] Orange circular fan valve location is correct
- [ ] White belly panel and zipper are correct
- [ ] Black eye and gill stripes are correct
- [ ] Side fins are correct
- [ ] Back fin and tail/back structure are plausible and not duplicated
- [ ] Black shoes are visible
- [ ] Product is full body and not cropped
- [ ] Scene does not hide critical product details
- [ ] Frame approved as locked first frame

If any item fails, regenerate first frame before video.

## 6. Video Generation

### Video Prompt

```text
Use the provided image as the locked first frame and exact product design.
The first frame is already approved and correct.
Generate a beach comedy video by animating this same inflatable shark costume only.
Do not redesign, reinterpret, replace, or redraw the costume.

STRICT PRODUCT LOCK:
The inflatable shark costume must remain identical to the first frame in every frame.
Preserve the exact blue transparent PVC face-viewing window on the upper white belly panel, the orange circular fan valve fixed on the same side torso/waist, the white belly panel, vertical zipper line, black round eye, black curved gill stripes, side fins, back fin, tail/back structure, blue legs, black shoes, all fabric wrinkles, seams, folds, and inflatable material.

CATEGORY LOCK:
This is a wearable inflatable costume, not a real shark, cartoon shark, plush toy, CGI creature, or redesigned mascot. Preserve the inflated nylon/plastic fabric, air-filled volume, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes.

FRAGILE DETAIL LOCK:
The face-viewing window must remain a blue-tinted transparent vinyl window with shiny reflections and cross seam lines. It is not a mouth, not teeth, not a logo, not a patch, not an eye, and not decoration.

The orange fan valve must stay small, flat, circular, orange, and fixed in the exact same side torso/waist position. Do not move, enlarge, duplicate, hide, recolor, or reshape it.

The back fin and tail/back structure must not duplicate, split, melt, or turn into a fish tail.

SCENE:
A sunny beach comedy scene. The same shark costume acts like an overly serious beach support manager at a snack or lemonade stand. Sand, ocean, a beach umbrella, towels, a cooler, and one amused beachgoer are visible in the background.

MOTION:
High accuracy motion only. Gentle inflatable bounce, one fin slowly points at the stand, one small proud nod, then a tiny one-step shuffle. Body rotation must stay under 8 degrees. Keep the same three-quarter product angle so both the transparent window and orange fan valve remain visible. Do not reveal unseen angles. Do not turn around, walk far, spin, jump, or dance wildly.

CAMERA:
Vertical 9:16. Stable medium-wide shot. Full body visible most of the time. No scene cuts. No fast zoom. Do not crop the head, fins, transparent window, orange fan valve, zipper, tail, or black shoes.

AUDIO:
Use off-screen narration only if the model supports audio. The costume itself does not talk and does not open a mouth. Suggested line: "Beach support has arrived." Add soft ocean ambience. No subtitles.

NEGATIVE:
No mouth, no red mouth, no teeth, no shark jaw, no new face opening, no human face visibility, no moved fan valve, no missing transparent window, no redesigned costume, no extra logos, no readable text, no subtitles, no hats, no sunglasses, no accessories, no cartoon, no real shark, no plush toy, no mascot redesign, no morphing, no transformation, no body deformation, no duplicated back fin, no broken tail.
```

### Suggested Model Settings

Use a model that supports first-frame image-to-video.

Recommended request settings:

```json
{
  "aspect_ratio": "9:16",
  "duration": 8,
  "mode": "high_accuracy",
  "camera": "static_or_slight_push_in",
  "audio": "optional_off_screen_only"
}
```

## 7. Video Review

Sample frames at:

- 0%
- 25%
- 50%
- 75%
- 100%

Acceptance checklist:

- [ ] Product accuracy score is at least 90
- [ ] Transparent window stays correct
- [ ] Orange fan valve stays correct
- [ ] Back fin and tail/back structure stay correct
- [ ] No invented mouth or teeth
- [ ] No extra fins or broken tail
- [ ] Motion is funny enough
- [ ] Beach scene is present
- [ ] Full body is visible

If the product fails, retry with:

```text
Reduce body rotation to 5 degrees.
Remove shuffle.
Use static camera only.
Simplify beach scene.
Require transparent window and fan valve visible for the whole video.
```

## 8. Test Pass Definition

This test passes only if:

- The shark costume remains visibly the same product
- Transparent window and orange fan valve are preserved
- Back fin and tail do not break
- The video has a beach comedy setting
- Motion is small but funny

If the scene is good but the product drifts, the test fails.
