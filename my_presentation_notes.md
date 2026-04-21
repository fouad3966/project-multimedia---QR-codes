# 🎤 My Presentation Part — Full Explanation

## My Sections
1. **The 8 Masks & Penalty Scoring** (full section)
2. **The Decoding Process** — Steps 1, 2, and 3

# PART 1: The 8 Masks & Penalty Scoring

---

## 🤔 Why Do Masks Even Exist?

### First: What Are "Structural Elements"?

A QR code is not just data. It has **fixed, built-in visual elements** that the scanner depends on to do its job. These are called **structural elements**:

| Structural Element | What It Looks Like | What the Scanner Uses It For |
|---|---|---|
| **Finder Patterns** | The 3 big squares in the corners | To locate and orient the QR code |
| **Timing Patterns** | The alternating ■□■□ lines between finders | To measure the size of each module |
| **Alignment Patterns** | Small squares inside large QR codes | To correct distortion across the grid |

These elements have very specific, **unique visual signatures**. For example, the timing pattern is always a perfect alternating stripe: `■ □ ■ □ ■ □`. The scanner is constantly looking for these signatures to navigate the code.

---

### The Problem: Data Can Accidentally Look Like Structural Elements

Here is the core issue. When you encode text into binary (0s and 1s), the result is essentially a **random sequence of black and white modules**. And sometimes, just by bad luck, that random data produces a pattern that looks exactly like a structural element.

**Concrete example — timing pattern confusion:**

The timing pattern looks like this (always perfectly alternating):
```
Row 6: ■ □ ■ □ ■ □ ■ □ ■ □ ■ □
```

Now imagine your encoded data accidentally produces **the exact same alternating pattern** somewhere in the data area:
```
Row 14 (data): ■ □ ■ □ ■ □ ■ □ ■ □ ■ □
```

The scanner sees this and gets confused — it now thinks there's a timing pattern in the middle of the data area. It tries to use it for grid calibration and **reads all the surrounding modules at the wrong positions**. The whole decode fails.

**Concrete example — finder pattern confusion:**

The scanner identifies finder patterns by looking for the ratio `1:1:3:1:1` (1 black, 1 white, 3 black, 1 white, 1 black) as it sweeps across the image. If your data area happens to contain:
```
Data row: □ □ □ □ ■ □ ■ ■ ■ □ ■ □ □ □ □
                   ↑ that's the 1:1:3:1:1 ratio!
```
The scanner finds a **fake finder pattern** inside the data. It thinks it found a QR code within the QR code, gets completely confused, and cannot decode.

---

### The Solution: Masking

**Masking breaks up those accidental patterns.** It flips just enough modules to destroy any unlucky sequences in the data area — while leaving the structural elements (finders, timing, alignment) completely untouched.

After the mask is applied:
- ✅ The structural elements still look exactly as the scanner expects
- ✅ The data area no longer accidentally mimics structural elements
- ✅ The decoder can just apply the same mask in reverse to get the original data back

> **Simple analogy:** Imagine a word document where some sentences accidentally look like chapter headings (same font size, same bold style). You'd reformat those sentences to look different — without changing the words. That's exactly what masking does to the QR code data.

---

## 🔢 What Are the 8 Masks?

A mask is a **mathematical formula** that takes a module's position (row, column) and decides: **should I flip this module or not?**

If the formula returns `true` → the module is **flipped** (black becomes white, white becomes black)
If the formula returns `false` → the module **stays the same**

This flipping is done with the **XOR operation** (exclusive OR):
- `black XOR true = white` (flipped)
- `white XOR true = black` (flipped)
- `black XOR false = black` (unchanged)
- `white XOR false = white` (unchanged)

### The 8 Formulas:

| Mask # | Formula | What It Produces |
|--------|---------|-----------------|
| **0** | `(row + col) % 2 == 0` | Checkerboard pattern (alternating like a chess board) |
| **1** | `row % 2 == 0` | Horizontal stripes (every other row is flipped) |
| **2** | `col % 3 == 0` | Vertical stripes every 3 columns |
| **3** | `(row + col) % 3 == 0` | Diagonal stripes every 3 |
| **4** | `(⌊row/2⌋ + ⌊col/3⌋) % 2 == 0` | Blocky rectangles (2×3 blocks) |
| **5** | `(r×c)%2 + (r×c)%3 == 0` | Complex star-like pattern |
| **6** | `((r×c)%2 + (r×c)%3) % 2 == 0` | Modified star pattern |
| **7** | `((r+c)%2 + (r×c)%3) % 2 == 0` | Diamond-like pattern |

### Example with Mask 0 (Checkerboard):

```
Original data:          Mask pattern:           After XOR:
■ ■ □ □ ■               ■ □ ■ □ ■               □ ■ ■ □ □
■ □ □ ■ ■               □ ■ □ ■ □               ■ ■ □ □ ■
□ ■ ■ □ □               ■ □ ■ □ ■               ■ ■ □ □ ■
```

> [!IMPORTANT]
> Masks are ONLY applied to **data and error correction modules**. The finder patterns, timing patterns, alignment patterns, and format information are NEVER masked.

---

## ⚖️ Penalty Scoring — How the Best Mask Is Chosen

The encoder doesn't randomly pick a mask. It **tries all 8 masks**, applies each one temporarily, and **scores** the result using 4 penalty rules. The mask with the **lowest total penalty wins**.

### Rule 1: Consecutive Same-Color Modules (Runs)

**What it checks:** Are there 5 or more modules of the same color in a row (horizontally or vertically)?

**Why it's bad:** Long runs of the same color look like timing patterns and confuse scanners.

**Scoring:**
- 5 in a row = **3 points** penalty
- Each additional module beyond 5 = **+1 point**
- Example: 7 black modules in a row = 3 + (7-5) = **5 points**

```
Bad:   ■ ■ ■ ■ ■ ■ ■ □    ← 7 consecutive = penalty of 5
Good:  ■ □ ■ ■ □ ■ □ ■    ← no run ≥ 5 = penalty of 0
```

---

### Rule 2: 2×2 Blocks of Same Color

**What it checks:** Are there any 2×2 squares where all 4 modules are the same color?

**Why it's bad:** Solid blocks make it harder to distinguish individual module boundaries.

**Scoring:** Each 2×2 block found = **3 points** penalty

```
Bad:   ■ ■      Good:  ■ □
       ■ ■             □ ■
  = 3 points        = 0 points
```

> [!NOTE]
> A 3×3 solid block actually contains FOUR overlapping 2×2 blocks, so it's penalized 4 × 3 = 12 points.

---

### Rule 3: Patterns That Look Like Finder Patterns

**What it checks:** Does the data area contain the sequence `■□■■■□■` followed by `□□□□` (or preceded by `□□□□`)?

**Why it's bad:** This is the exact ratio (1:1:3:1:1) that scanners use to detect finder patterns. If this appears in the data area, the scanner might detect **false finder patterns** and get confused.

**Scoring:** Each occurrence found = **40 points** penalty (heavily penalized!)

```
Dangerous:  □ □ □ □ ■ □ ■ ■ ■ □ ■    ← looks like a finder pattern!
            Penalty: 40 points
```

---

### Rule 4: Color Balance (Black/White Ratio)

**What it checks:** How far is the overall black/white ratio from 50%?

**Why it's bad:** If the QR code is, say, 80% black, the low contrast makes scanning unreliable.

**Scoring:**
- Calculate the percentage of black modules
- Find how far it is from 50%
- Every 5% deviation = **10 points** penalty

```
Example: 55% black → 5% deviation  → 10 points
Example: 65% black → 15% deviation → 30 points
Example: 50% black → 0% deviation  → 0 points (perfect!)
```

---

### Final Selection Process

```
Mask 0:  Rule1=45  Rule2=60  Rule3=40  Rule4=10  → Total: 155
Mask 1:  Rule1=38  Rule2=75  Rule3=80  Rule4=20  → Total: 213
Mask 2:  Rule1=52  Rule2=45  Rule3= 0  Rule4= 5  → Total: 102  ← LOWEST!
Mask 3:  Rule1=41  Rule2=54  Rule3=40  Rule4=15  → Total: 150
...

Winner: Mask 2 (penalty = 102) ✅
```

The **mask number** (0–7) is then stored in the **format information** area of the QR code, so the decoder knows which mask to reverse.

---

### 💬 Talking Points for Masks

> "Without masking, the raw data could create patterns that confuse QR scanners — imagine a large block of black modules that a scanner mistakes for a finder pattern."

> "The QR encoder isn't guessing — it systematically tests all 8 masks, scores each one against 4 penalty rules, and picks the one that produces the cleanest, most scannable result."

> "The mask is applied using XOR, which is perfectly reversible — the decoder simply applies the same mask again to recover the original data."

---

---

# PART 2: The Decoding Process (Steps 1–3)

---

## Overview — What Happens When You Scan a QR Code?

When you point your phone camera at a QR code, the following happens in **milliseconds**. Your part covers the first 3 steps — the **image processing** phase that happens before any data decoding begins.

```
📷 Camera Image
    ↓
Step 1: Find the QR code in the image
    ↓
Step 2: Correct the perspective/angle
    ↓
Step 3: Extract the grid of modules
    ↓
(Steps 4-7: Format reading, unmasking, ECC, data extraction)
```

---

## Step 1: Detection & Localization

### What Happens
The scanner's first job is to **find** the QR code within the camera image. The image might contain a table, a person's hand, a wall — the scanner needs to locate exactly where the QR code is.

### How — The Finder Pattern Trick

Every QR code has **3 finder patterns** — those distinctive big squares in three corners:

```
┌─────────┐                     ┌─────────┐
│ ■■■■■■■ │                     │ ■■■■■■■ │
│ ■□□□□□■ │                     │ ■□□□□□■ │
│ ■□■■■□■ │                     │ ■□■■■□■ │
│ ■□■■■□■ │       (no finder    │ ■□■■■□■ │
│ ■□■■■□■ │        here →)     │ ■□■■■□■ │
│ ■□□□□□■ │                     │ ■□□□□□■ │
│ ■■■■■■■ │                     │ ■■■■■■■ │
└─────────┘                     └─────────┘


┌─────────┐
│ ■■■■■■■ │
│ ■□□□□□■ │
│ ■□■■■□■ │
│ ■□■■■□■ │
│ ■□■■■□■ │
│ ■□□□□□■ │
│ ■■■■■■■ │
└─────────┘
```

### The 1:1:3:1:1 Ratio — The Key Detection Method

If you draw a line through a finder pattern in **any direction** (horizontal, vertical, or diagonal), you always cross:
- 1 black → 1 white → 3 black → 1 white → 1 black

```
■ □ ■■■ □ ■
1 : 1 : 3 : 1 : 1
```

**This ratio is unique.** Nothing else in the world reliably produces this exact pattern. The scanner sweeps the camera image line by line, looking for this ratio:

```
Scanning line by line:
Line 45: ...□□□■□■■■□■□□□...  → Ratio check: 1:1:3:1:1 ✓ FOUND!
Line 46: ...■■□□□□□□■□□■■...  → No match
Line 47: ...□□□■□■■■□■□□□...  → Ratio check: 1:1:3:1:1 ✓ Confirmed!
```

### Finding 3 Finders = QR Code Located

Once the scanner finds 3 groups with the 1:1:3:1:1 ratio, it knows:
- **Where** the QR code is in the image
- **How big** it is (distance between finders)
- **Which way it's oriented** (the missing corner tells the direction)

```
Finder A (top-left) ←————→ Finder B (top-right)
    |                              
    |         ← The 4th corner has NO finder,
    |            so the scanner knows orientation
    ↓
Finder C (bottom-left)
```

> [!TIP]
> **Why only 3, not 4?** Precisely so the scanner can determine orientation! If all 4 corners had finders, the scanner couldn't tell which way is up.

---

## Step 2: Perspective Correction

### The Problem

In real life, people rarely scan a QR code from **perfectly straight above**. The camera is usually at an angle:

```
Perfect view:          Real-life view:
┌──────────┐              ╱‾‾‾‾‾‾‾‾╲
│          │             ╱            ╲
│  QR Code │            │   QR Code    │
│          │             ╲            ╱
└──────────┘              ╲________╱
(square)                (trapezoid/skewed)
```

If the scanner tried to read the skewed image directly, modules would be in the wrong positions and the data would be garbage.

### The Solution: Homography Transformation

**Homography** is a mathematical operation that "un-warps" a tilted image back to a flat square.

How it works:
1. The scanner knows where the **3 finder pattern centers** are in the skewed image
2. It knows where they **should** be in a perfect square
3. It calculates a **transformation matrix** (3×3 matrix called a homography matrix) that maps from the skewed coordinates to the correct ones
4. Every pixel is remapped to its corrected position

```
Before correction:           After correction:
    A───────B                A─────────B
   ╱       ╱                │           │
  ╱       ╱         →       │   FLAT    │
 ╱       ╱                  │   SQUARE  │
C───────D                   C─────────D
(skewed)                    (corrected)
```

### In Simple Terms

> "The scanner sees a distorted shape, identifies 3 known reference points (the finder pattern centers), and mathematically transforms the image so the QR code appears as a perfect flat square — as if you were looking at it from directly above."

This is the **exact same technology** used in:
- Document scanning apps (when you photograph a tilted document)
- Augmented reality (placing virtual objects on tilted surfaces)
- Panoramic photo stitching

---

## Step 3: Grid Sampling

### The Problem

After perspective correction, we have a flat square image. But it's still just **pixels** — the scanner needs to figure out: which pixel belongs to which **module** (black or white cell)?

### How — Using Timing Patterns as Rulers

Remember the **timing patterns** — those alternating black-white lines between the finders?

```
Finder ■□■□■□■□■□■□■□■ Finder
       ↑ ↑ ↑ ↑ ↑ ↑ ↑
       These tell the scanner exactly
       how wide each module is!
```

The timing patterns act like a **ruler**:
- They run horizontally (row 6) and vertically (column 6)
- They **always** alternate: black, white, black, white...
- By measuring the spacing between these alternations, the scanner calculates the **exact pixel size of one module**

### The Sampling Process

1. **Find timing patterns** — locate the alternating row 6 and column 6
2. **Calculate module size** — measure the pixel distance between alternations
3. **Build a grid** — overlay a grid of rows × columns across the corrected image
4. **Sample each cell** — for each grid position, check the center pixel: **black or white?**

```
Corrected image with grid overlay:
┌───┬───┬───┬───┬───┐
│ ■ │ □ │ ■ │ ■ │ □ │  ← Each cell sampled at center
├───┼───┼───┼───┼───┤
│ □ │ ■ │ □ │ ■ │ ■ │
├───┼───┼───┼───┼───┤
│ ■ │ ■ │ ■ │ □ │ □ │
├───┼───┼───┼───┼───┤
│ □ │ □ │ ■ │ □ │ ■ │
└───┴───┴───┴───┴───┘

Result: Binary matrix
1 0 1 1 0
0 1 0 1 1
1 1 1 0 0
0 0 1 0 1
```

### Alignment Patterns Help Too

For larger QR codes (version 2+), **alignment patterns** — those small squares scattered inside the code — provide additional anchor points to ensure the grid stays accurate across the entire area. Without them, even slight curvature or lens distortion could throw off modules far from the finders.

### The Output

After grid sampling, we go from a **camera photograph** to a clean **binary matrix** (2D array of 0s and 1s). This is now pure data — the image processing is done, and the remaining decoding steps (4–7) work entirely on this matrix.

```
Camera photo → Step 1 (find it) → Step 2 (flatten it) → Step 3 (read the grid)
                                                              ↓
                                                    Clean binary matrix
                                                    ready for data decoding
```

---

## 💬 Talking Points for Steps 1–3

> **Step 1:** "The scanner uses the unique 1:1:3:1:1 ratio of finder patterns — this ratio appears the same from any angle or distance, making detection extremely reliable."

> **Step 2:** "Even if you scan at a 45-degree angle, homography correction remaps every pixel to where it should be — like mathematically flattening a photograph of a tilted poster."

> **Step 3:** "The timing patterns act as rulers — their fixed alternating spacing tells the scanner exactly how to divide the image into individual modules, producing the binary matrix for decoding."

---

## 📊 Quick Reference — Summary Table

| Topic | Key Concept | Remember This |
|-------|-------------|---------------|
| **Why masks?** | Prevent scanner confusion | Data can accidentally look like finder/timing patterns → scanner breaks |
| **Structural elements** | Fixed visual parts of QR | Finders, Timing, Alignment — scanner navigates using their signatures |
| **How masks work** | XOR with a formula | Each mask is a math formula based on (row, col) — flip or don't flip |
| **8 masks** | All tested, best wins | Encoder tries all 8 and picks lowest penalty score |
| **Rule 1** | Long same-color runs | 5+ consecutive = bad (looks like timing pattern) |
| **Rule 2** | 2×2 solid blocks | Hard to see module boundaries |
| **Rule 3** | Finder-like sequences | 1:1:3:1:1 in data area = very bad (40 pts each!) |
| **Rule 4** | Color balance | Far from 50/50 = poor contrast |
| **Decoding Step 1** | Find the QR code | 1:1:3:1:1 ratio in finder patterns — unique signature |
| **Decoding Step 2** | Flatten the image | Homography matrix corrects camera angle distortion |
| **Decoding Step 3** | Extract the grid | Timing patterns = ruler → sample each module → binary matrix |

---

---

# 🗣️ FINAL RECAP — What To Say In Each Section

> Use this to revise before your presentation. Each bullet = one thing to say out loud.

---

## 🎭 Masks — What to Say

### Opening (introduce the topic)
- *"Before we talk about masks, you need to understand that a QR code is not just data — it has fixed structural elements that the scanner depends on."*
- *"These are: the three big squares called finder patterns, the alternating stripes called timing patterns, and the small squares called alignment patterns."*
- *"The scanner identifies these by their specific visual signatures — for example, the timing pattern is always a perfect alternating black-white stripe."*

### The Problem
- *"The issue is: when you convert text into binary, the result is essentially random black and white modules. And sometimes, by pure bad luck, your data accidentally produces a pattern that looks exactly like one of these structural elements."*
- *"For example, if the data randomly creates a perfect alternating stripe in the middle of the code, the scanner thinks it found a timing pattern and calibrates the grid from the wrong position — and the whole decode fails."*
- *"Or if the data creates a 1:1:3:1:1 sequence — which is the exact signature of finder patterns — the scanner finds a fake finder pattern and gets completely lost."*

### The Solution
- *"The solution is masking. A mask is a mathematical formula that, based on each module's row and column position, decides: flip this module or leave it."*
- *"Flipping is done with XOR — black becomes white, white becomes black. It's perfectly reversible."*
- *"Crucially, masks are ONLY applied to the data area. The structural elements — finders, timing, alignment — are never touched."*
- *"After masking, the data no longer accidentally mimics structural elements, so the scanner can navigate correctly."*

### The 8 Masks & Penalty Scoring
- *"There are 8 possible mask patterns — each is a different formula. The encoder doesn't just pick one randomly."*
- *"It applies all 8 masks one by one, and for each result, it calculates a penalty score using 4 rules."*
- *"Rule 1 penalizes long runs of the same color — 5 or more in a row scores 3 points, plus 1 more for each extra."*
- *"Rule 2 penalizes 2×2 solid blocks — each one is 3 points."*
- *"Rule 3 heavily penalizes any sequence that looks like a finder pattern in the data area — that's 40 points per occurrence."*
- *"Rule 4 penalizes imbalance — if the code is way more black than white, or vice versa, 10 points per 5% deviation."*
- *"The encoder picks whichever mask got the LOWEST total score. That mask number is then saved in the format information so the decoder knows which one to reverse."*

---

## 📷 Decoding Steps 1–3 — What to Say

### Opening
- *"Now let's flip to the other side — what happens when someone scans a QR code with their phone."*
- *"The decoding process has 7 steps. My part covers the first three — which are all about image processing, before any actual data is read."*

### Step 1: Detection
- *"The first step is for the scanner to find the QR code inside the camera image. The image might have a table, a hand, a wall — the scanner has to locate the QR code precisely."*
- *"It does this by sweeping the image line by line, looking for the 1:1:3:1:1 ratio — that's 1 black, 1 white, 3 black, 1 white, 1 black."*
- *"This is the unique signature of every finder pattern. Nothing else in a normal image reliably produces this ratio."*
- *"Once it finds THREE such patterns, it knows: here is the QR code. The distance between them tells the size, and the missing fourth corner tells the orientation — which way is up."*
- *"This is exactly why there are only 3 finder patterns and not 4 — if all 4 corners had them, the scanner couldn't know which way the code is rotated."*

### Step 2: Perspective Correction
- *"Step two solves a real-world problem: nobody scans perfectly from directly above. The camera is always at some angle, making the QR code look like a trapezoid instead of a square."*
- *"If the scanner tried to read modules from a skewed image, every position would be off and the data would be garbage."*
- *"The solution is a homography transformation — a 3×3 matrix that mathematically remaps every pixel from the skewed image to where it would be in a perfect flat square."*
- *"The scanner calculates this matrix using the 3 finder pattern centers as reference points — it knows exactly where they are in the skewed image, and exactly where they should be in a flat square, so it computes the transformation between the two."*
- *"Think of it like document scanner apps on your phone — you photograph a tilted page and it comes out perfectly flat. Same technology."*

### Step 3: Grid Sampling
- *"After perspective correction, we have a flat square image. But it's still a photograph — just pixels. The scanner now needs to figure out which pixel belongs to which module."*
- *"It uses the timing patterns as a ruler. Remember, timing patterns are always a perfect alternating stripe. By measuring the pixel distance between each alternation, the scanner knows exactly how many pixels wide one module is."*
- *"It then builds a grid over the entire image and samples the center pixel of each cell — is it closer to black or white? That gives a 1 or a 0."*
- *"The output of step 3 is a clean binary matrix — just a 2D grid of 1s and 0s. No more pixels, no more camera image. Pure data, ready for the remaining decoding steps."*

### Closing
- *"So to summarize my part: masks prevent data from being mistaken for structural elements — and they do it by testing all 8 patterns and picking the one that causes the least visual confusion. And on the decoding side, before any data is read, the scanner first finds the code using the 1:1:3:1:1 signature, flattens the perspective mathematically, and then converts the image into a binary matrix using timing patterns as a ruler."*

---

---

# 👥 Team Members

**Spécialité Multimédia — Université — 2025/2026**

### Groupe 01
| Nom Complet | Groupe |
|---|---|
| Miloudi Ahmed Aboubaker Esseddik | 01 |
| Rabahi Mohamed Fouad | 01 |
| Ameur Mohammed Menouer | 01 |

### Groupe 02
| Nom Complet | Groupe |
|---|---|
| Bensalah Merwane | 02 |
| Saidane Mohamed Elamine | 02 |
