# Product-Locked Image-to-Video Workflow

## Goal

Build a repeatable product video workflow where product accuracy is more important than motion, scene richness, or duration.

Priority order:

1. Product accuracy
2. Interesting motion
3. Rich scene
4. Longer duration

The video model should not be asked to invent or reinterpret the product. It should only animate an already approved first frame under strict motion limits.

## Product Category

This workflow is designed for wearable inflatable costume products.

Examples:

- Inflatable shark costume
- Inflatable frog costume
- Inflatable dinosaur or T-rex costume
- Inflatable sumo costume
- Inflatable lion costume
- Other wearable inflatable animal, character, or novelty costumes

These products share the same core risks:

- The model may turn a wearable costume into a real animal or cartoon mascot.
- The model may add a mouth, teeth, eyes, fur, claws, or accessories that do not exist on the product.
- The model may move or remove the fan valve.
- The model may hide or change the human face window, zipper, or entry opening.
- The model may break tail, fin, ear, mane, horn, limb, or back structures during motion.
- The model may remove the inflated fabric texture and make the product look like rubber, plush, CGI, or a real creature.

The product must always remain a wearable inflatable costume.

## Workflow Overview

```text
Product image upload
-> Product Lock Card
-> User confirmation
-> First-frame generation
-> First-frame review
-> Video generation
-> Video quality review
-> Accept or retry with stricter limits
```

## 1. Product Image Upload

### 1.0 Inflatable Costume Category Lock

Every product in this category should automatically receive a category-level lock before SKU-specific details are added.

Default category lock:

```text
This product is a wearable inflatable costume.
It must remain a real inflatable wearable product, not a real animal, not a cartoon character, not a plush toy, not a CGI creature, and not a redesigned mascot.

Preserve the inflated nylon/plastic fabric, wrinkles, seams, folds, air-filled volume, zipper or entry line, leg openings, visible shoes or foot covers, side/back appendages, and the fan valve or air inlet.

Do not add new body parts, facial features, teeth, claws, fur, scales, accessories, logos, text, or patterns unless they exist in the uploaded product images.
```

This category lock is always combined with the SKU-level Product Lock Card.

### 1.1 Required Images

Minimum input:

- Front view
- Side view
- Back view

Recommended input:

- Front view
- Left side view
- Right side view
- Back view
- Close-up of each fragile detail
- Optional real usage image, if available

Fragile details are parts that video models often move, erase, resize, or redesign.

Examples:

- Transparent windows
- Valves, buttons, switches, logos, vents
- Handles, straps, zippers, wheels, feet, shoes
- Fins, tails, ears, sleeves, openings, seams
- Printed graphics or repeated patterns
- Manes, horns, snouts, crowns, bellies, mouths printed on fabric, claws printed on fabric

### 1.1.1 Inflatable Costume Image Requirements

For inflatable costumes, the upload flow should request these views whenever possible:

- Full front view, showing face window, belly panel, zipper, or printed face
- Full side view, showing fan valve, arm/fin/leg shape, and side profile
- Full back view, showing tail, back fin, mane, zipper, or rear seam layout
- Close-up of fan valve or air inlet
- Close-up of face-viewing window or human face opening
- Close-up of special appendages, such as tail, fin, ears, mane, horns, claws, or belly shape

The system should warn the user if no image shows the fan valve or face opening, because those parts are high-risk drift points.

### 1.2 Image Requirements

Uploaded product images should meet these requirements:

- Same SKU and same colorway across all images
- Product is clear, sharp, and not blocked
- Product is not cropped at important edges
- Product fills enough of the image to expose details
- Lighting is neutral enough to identify true colors
- No heavy filter, stylized rendering, or unrelated product mixed in
- White or clean background preferred

If the images conflict with each other, the system should stop and ask the user which image is authoritative.

### 1.3 System Extraction

After upload, the system creates a Product Lock Card.

The Product Lock Card must include:

- Product name or temporary label
- Costume type
- Category-level lock
- Main visual identity
- Required visible landmarks
- Fragile details
- Forbidden changes
- Preferred camera angle
- Maximum safe motion
- User confirmation status

Example schema:

```json
{
  "product_label": "Blue inflatable shark costume",
  "category": "wearable_inflatable_costume",
  "costume_type": "shark",
  "category_lock": [
    "must remain a wearable inflatable costume",
    "must not become a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot",
    "must preserve inflated fabric, wrinkles, seams, zipper or entry line, leg openings, foot covers or shoes, and fan valve"
  ],
  "main_identity": [
    "bright blue inflatable wearable body",
    "large white front belly panel",
    "black round eye",
    "black curved gill stripes"
  ],
  "locked_landmarks": [
    {
      "name": "blue transparent PVC face-viewing window",
      "location": "upper front white belly panel",
      "must_remain_visible": true,
      "forbidden_changes": [
        "must not become a mouth",
        "must not become teeth",
        "must not become a logo",
        "must not move"
      ]
    }
  ],
  "fragile_details": [],
  "preferred_angle": "three-quarter side angle that shows front window and side valve",
  "max_rotation_degrees": 8,
  "status": "pending_user_confirmation"
}
```

### 1.3.1 Costume Type Templates

The system should use the costume type to prefill likely lock points. The user can edit these before generation.

Shark:

- Fins
- Tail or back fin structure
- Gill stripes
- Side eye
- Belly panel
- Face-viewing window
- Fan valve

Frog:

- Large eye shapes
- Mouth or smile print, if present
- Belly panel
- Webbed hands or feet, if present
- Face-viewing window or face opening
- Fan valve

Dinosaur or T-rex:

- Head shape and snout
- Printed or attached teeth, only if present in product photos
- Small arms
- Tail
- Back ridges or spikes, if present
- Belly panel
- Face opening
- Fan valve

Sumo:

- Round inflated body silhouette
- Printed belt or mawashi area
- Head/hair print or head opening
- Arm and leg openings
- Fabric folds and belly shape
- Fan valve

Lion:

- Mane shape and color
- Face opening or printed face
- Ears
- Tail
- Paws or foot covers
- Belly panel, if present
- Fan valve

Generic inflatable costume:

- Main body silhouette
- Face-viewing window or face opening
- Fan valve or air inlet
- Zipper or entry line
- Arm, leg, and foot openings
- Special appendages
- Printed details
- Fabric wrinkles and seams

### 1.3.2 High-Risk Drift Points

For all inflatable costumes, these are treated as high-risk by default:

- Fan valve or air inlet
- Face-viewing window or human face opening
- Zipper or entry seam
- Tail, back fin, mane, spikes, horns, ears, or other appendages
- Foot covers, black shoes, or visible footwear
- Printed facial features
- Belly panel or central color block

The Product Lock Card should mark these as critical unless the user explicitly downgrades them.

### 1.4 User Confirmation

The system must ask the user to confirm the Product Lock Card before generating the first frame.

User-facing confirmation prompt:

```text
Please confirm the product lock points before first-frame generation.

1. Are these the correct must-preserve product details?
2. Are any details missing?
3. Which uploaded image is the most authoritative if the model must choose one?
4. Where is the fan valve or air inlet?
5. Where is the face-viewing window or human face opening?
6. Which appendages must not change, such as tail, fins, ears, mane, spikes, horns, arms, legs, or foot covers?
```

The user can:

- Approve
- Edit lock points
- Mark a detail as critical
- Upload more detail images
- Select the authoritative product view

Do not continue to first-frame generation while the Product Lock Card is unconfirmed.

## 2. First-Frame Generation

### 2.1 Purpose

The first frame is the approved product-in-scene image that later becomes the exact starting frame for video generation.

The first-frame model should solve only this problem:

```text
Place the correct product into the chosen scene while preserving product structure.
```

It should not be allowed to creatively redesign the product.

### 2.2 First-Frame Strategy

Preferred strategy:

1. Use the most authoritative product view as the main subject.
2. Use other views only to preserve structure and fragile details.
3. Generate the requested scene around the product.
4. Keep product angle close to a known uploaded angle.
5. Avoid angles that require the model to invent unseen product geometry.

For complex products, do not ask for a dramatic pose in the first frame. Use a stable pose that exposes the critical details.

For inflatable costumes, the first frame should normally use a three-quarter angle that keeps the fan valve and face opening/window visible when possible. If those two details cannot both be visible, the user must choose which detail is more important for the specific video.

### 2.3 First-Frame Prompt Template

```text
Use the provided product images as exact product references.

Primary task:
Create one realistic first-frame image for later image-to-video generation.

Product lock:
Preserve the product design exactly. Do not redesign, simplify, replace, recolor, or reinterpret the product.

Category lock:
This is a wearable inflatable costume. It must not become a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot. Preserve the inflated fabric, air-filled volume, wrinkles, seams, zipper or entry line, fan valve, leg openings, and foot covers or visible shoes.

Must preserve:
{{LOCKED_LANDMARKS}}

Fragile details:
{{FRAGILE_DETAILS}}

Scene:
{{SCENE_DESCRIPTION}}

Composition:
{{PREFERRED_ANGLE}}
Full product visible.
Do not crop any critical details.
Leave enough space around the product for small motion.

Style:
Realistic commercial product image, clean lighting, sharp product detail.

Avoid:
{{FORBIDDEN_CHANGES}}
No logos, no random text, no watermark, no invented accessories, no deformed product parts.
```

### 2.4 First-Frame Review

The generated first frame must be reviewed before video generation.

Review checklist:

- Product remains a wearable inflatable costume
- Product shape matches the uploaded references
- Colors match
- Critical landmarks are visible
- Fragile details are in the correct location
- No new mouth, logo, accessory, pattern, or structural part was invented
- Product is not cropped
- Product angle is safe for video
- Scene does not hide key product details

The system should show a review form:

```text
First-frame review:

[ ] Product shape is correct
[ ] Colors are correct
[ ] Critical landmarks are correct
[ ] Fragile details are correct
[ ] No invented parts
[ ] Product is fully visible
[ ] This frame may be used as the locked video first frame
```

If any critical item fails, regenerate or edit the first frame. Do not proceed.

## 3. Video Generation

### 3.1 Video Model Role

The video model only animates the approved first frame.

It must not:

- Redesign product geometry
- Invent unseen angles
- Move fragile details
- Add new product features
- Replace the product with a mascot, cartoon, or related object
- Turn the inflatable costume into a real animal or creature
- Invent natural anatomy, fur, scales, claws, teeth, or moving mouth parts not present in the product

### 3.2 Motion Budget

Every video request should choose a motion budget.

High accuracy mode, default for product videos:

- Body rotation: 0-8 degrees
- Small bounce
- Small fin/arm/hand movement
- Tiny one-step shuffle
- No large walking path
- No spin, jump, fast dance, or turn-around
- No full back reveal unless the back view was explicitly approved as safe

Balanced mode:

- Body rotation: up to 15 degrees
- Small walk
- Mild gesture
- Some scene interaction

Creative mode:

- Larger motion
- Higher risk of product drift
- Only use when user accepts lower product accuracy

### 3.3 Video Prompt Template

```text
Use the provided image as the locked first frame and exact product design.
The first frame is already approved and correct.
Generate motion by animating this same product, not by redesigning or reinterpreting it.

STRICT PRODUCT LOCK:
The product must remain identical to the first frame in every frame.
Preserve the exact shape, position, scale, and appearance of:
{{LOCKED_LANDMARKS}}

CATEGORY LOCK:
This is a wearable inflatable costume, not a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot. Preserve inflated fabric, wrinkles, seams, zipper or entry line, fan valve, leg openings, foot covers or visible shoes, and air-filled body volume.

FRAGILE DETAIL LOCK:
{{FRAGILE_DETAIL_RULES}}

SCENE:
{{VIDEO_SCENE}}

MOTION:
{{MOTION_BUDGET}}
Keep movement small and controlled.
Do not reveal unseen angles.

CAMERA:
{{CAMERA_RULES}}

AUDIO:
{{AUDIO_RULES}}

NEGATIVE:
{{NEGATIVE_PROMPT}}
```

### 3.4 Scene Complexity Rules

If product accuracy is critical:

- Prefer stable camera
- Prefer full-body or full-product framing
- Prefer small gestures
- Prefer simple scene interaction
- Avoid scene cuts
- Avoid fast camera motion
- Avoid full rotation
- Avoid occlusion from people, props, smoke, water, or bright effects

If the scene is very different from the first frame, use extra caution. A major background change can cause the model to redraw the product.

### 3.5 Video Review

After generation, review at least five frames:

- Start
- 25%
- 50%
- 75%
- End

Video acceptance checklist:

- Product remains a wearable inflatable costume
- Product remains the same in all reviewed frames
- Critical landmarks stay fixed
- Fragile details do not move, disappear, duplicate, or resize
- Product does not become a cartoon, mascot, or different object
- No new mouth, teeth, logo, accessory, or pattern
- Motion is interesting enough
- Scene is acceptable
- No severe crop, blur, or deformation

Suggested scoring:

```text
Product accuracy: 0-100, must be at least 90
Motion interest: 0-100, target at least 70
Scene richness: 0-100, target at least 60
Duration: informational only
```

If product accuracy is below threshold, the retry must reduce creative freedom:

- Reduce rotation
- Reduce movement
- Simplify scene
- Use more static camera
- Shorten duration if needed
- Strengthen fragile detail lock

## 4. Retry Strategy

### 4.1 Product Drift

Symptoms:

- Product shape changes
- Fragile details move
- Back fins, tails, handles, or openings become wrong
- Inflatable costume becomes a real animal, cartoon, plush toy, or mascot
- Natural anatomy appears, such as new teeth, claws, fur, scales, or moving mouth parts

Retry:

- Use high accuracy motion budget
- Keep same visible angle
- Add "do not reveal unseen angles"
- Reduce body rotation to 5-8 degrees

### 4.2 Detail Drift

Symptoms:

- Valve moves
- Transparent window becomes mouth or logo
- Printed pattern changes
- Face opening changes shape or reveals a human face when it should not
- Tail, fin, mane, horn, ear, or spike duplicates or melts

Retry:

- Move fragile detail lock higher in prompt
- Describe exact location and forbidden interpretations
- Require detail to remain visible throughout

### 4.3 Scene Failure

Symptoms:

- Scene does not change
- Scene hides product
- Scene dominates product

Retry:

- Keep product lock unchanged
- Rewrite scene more simply
- Avoid too many props
- Use "background changes, product remains locked"

### 4.4 Motion Failure

Symptoms:

- Motion too boring
- Motion too wild
- Product deforms during action

Retry:

- Add one clear small action
- Remove complex action sequence
- Keep the action near the original pose

## 5. Product Implementation Notes

Future web product modules:

1. Upload module
2. Product Lock Card editor
3. User confirmation step
4. First-frame generator
5. First-frame approval UI
6. Video prompt builder
7. Video generator
8. Frame sampler and quality review
9. Retry controller
10. Final export

Important product behavior:

- Never treat uploaded product images as decorative references only.
- Always convert product images into explicit lock points.
- Always ask the user to confirm lock points.
- Always require first-frame approval before video generation.
- Always review generated video before marking it successful.
- Always prioritize product accuracy over duration.
