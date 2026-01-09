# Intelligent Import Progression - User Guide

## What This Feature Does

When you import routines from Hevy, the app now intelligently analyzes your workout history to help you pick up where you left off. Instead of just showing you what you lifted last time, it:

1. **Pulls recent workout data** - Finds your most recent workout for each routine
2. **Analyzes your performance** - Checks if you hit your rep targets according to GZCLP rules
3. **Calculates next weights** - Suggests what you should lift next based on whether you succeeded or failed
4. **Shows the reasoning** - Explains why each suggestion was made

This eliminates the guesswork and manual calculation when importing your training history.

## Understanding the Analysis Display

### Visual States

Each exercise card uses color-coding to help you quickly understand what happened in your last workout:

| Color | Meaning | What Happened |
|-------|---------|---------------|
| **Green** | Success - Progress | You hit all your rep targets, so weight increases |
| **Blue** | Success - Repeat | You met T3 threshold but didn't hit 25+ reps, continue at same weight |
| **Amber** | Fail - Stage Change | You missed reps, so the program moves you to an easier rep scheme (same weight, more sets, fewer reps) |
| **Red** | Fail - Deload | You failed at the final stage, so weight reduces to 85% to rebuild |
| **Gray** | No Data | No recent workout found, using routine template values |

### What the Information Means

Each exercise card shows:

**Source**: Which workout the data came from and when it was performed
- Example: "Jan 5, 2026" or "No workout data"

**Lifted**: What you actually did in that workout
- Format: `[weight] x [sets] sets ([reps per set])`
- Example: "100kg x 5 sets (3, 3, 3, 3, 5 reps)"

**Result**: Whether you met the success criteria
- Shows "SUCCESS" or "FAIL" badge with explanation
- Example: "SUCCESS - Hit all sets, AMRAP: 5 reps" or "FAIL - Set 3 only hit 7/10 reps"

**Next Target**: What the app suggests for your next workout
- Editable weight input field
- Shows the progression reasoning (e.g., "+2.5kg progression" or "Stage change to 3x8")
- For stage changes, also shows a dropdown to select the new stage

## How GZCLP Progression Works

The app follows the official GZCLP progression rules for each tier:

### T1 (Main Lifts): 5x3+ → 6x2+ → 10x1+

**Stage A (5x3+):**
- Target: 3 reps on all 5 sets, with as many as possible (AMRAP) on the last set
- Success: Hit 3+ reps on all sets → Add weight (2.5kg lower body, 1.25kg upper body)
- Failure: Missed reps → Move to Stage B (6x2+)

**Stage B (6x2+):**
- Target: 2 reps on all 6 sets, AMRAP on the last set
- Success: Hit 2+ reps on all sets → Add weight
- Failure: Missed reps → Move to Stage C (10x1+)

**Stage C (10x1+):**
- Target: 1 rep on all 10 sets, AMRAP on the last set
- Success: Hit 1+ rep on all sets → Add weight
- Failure: Missed reps → **Deload to 85%** of current weight, restart at Stage A (5x3+)

### T2 (Secondary Lifts): 3x10 → 3x8 → 3x6

**Stage A (3x10):**
- Target: 10 reps on all 3 sets
- Success: Hit 10 reps on all sets → Add weight (2.5kg)
- Failure: Missed reps on any set → Move to Stage B (3x8)

**Stage B (3x8):**
- Target: 8 reps on all 3 sets
- Success: Hit 8 reps on all sets → Add weight
- Failure: Missed reps on any set → Move to Stage C (3x6)

**Stage C (3x6):**
- Target: 6 reps on all 3 sets
- Success: Hit 6 reps on all sets → Add weight
- Failure: Missed reps on any set → **Deload to 85%** of current weight, restart at Stage A (3x10)

### T3 (Accessory Lifts): 3x15+

**Single Stage:**
- Target: 15 reps on first 2 sets, as many as possible (AMRAP) on the 3rd set
- Success: Hit 25+ reps on AMRAP set → Add weight (2.5kg)
- Failure: Less than 25 reps on AMRAP set → **Repeat same weight** (no stage changes or deloads for T3)

## How to Use This Feature

### Step 1: Review Each Day

When you reach the import review step, you'll see tabs for each GZCLP day (A1, B1, A2, B2). Click through each tab to review the exercises for that day.

### Step 2: Understand the Suggestions

For each exercise, look at:
- The color-coded border to see success/failure at a glance
- The lifted data to see what you actually did
- The result badge and explanation to understand why
- The next target suggestion to see what the app recommends

### Step 3: Override if Needed

You can edit any value before completing setup:

**Change Weight:**
- Click in the "Next Target" input field
- Type the weight you want to use
- The app will round to the nearest valid increment (2.5kg or 5lbs)

**Change Stage (for stage changes):**
- If the app suggests a stage change, you'll see a dropdown
- Select a different stage if you disagree with the suggestion
- The app will update the rep scheme accordingly

### Step 4: Complete Setup

Once you've reviewed and adjusted all four days:
1. Click "Continue" to proceed
2. The app saves your chosen values (suggested or overridden)
3. Your next workout will show these targets

## Common Questions

### Why is my suggested weight different from what I lifted?

The app shows your **next target**, not your last lifted weight. This means:

- **If you succeeded**: Weight increases (green or blue)
- **If you failed but not at final stage**: Same weight, easier rep scheme (amber)
- **If you failed at final stage**: Weight decreases 15% for rebuilding (red)

This is the core of progressive overload - you're always working toward the next level.

### Can I ignore the suggestions?

**Yes, absolutely!** The suggestions are calculated based on strict GZCLP rules, but you know your body best. You can:

- Increase weight more conservatively if you want
- Skip a stage change if you think you can push through
- Use a different weight if you know something the app doesn't (injury, fatigue, etc.)

Just edit the weight or stage before clicking Continue.

### What if I don't have recent workout data?

If the app shows "No workout data" for an exercise, it means:

- No recent workout was found for that routine in Hevy
- The app falls back to using weights from the routine template
- The card will have a gray border

You can still edit these values manually before completing setup.

### Why does my T3 show "repeat" when I did 20 reps?

T3 exercises require **25+ reps on the AMRAP set** to progress. This is a high bar by design:

- 15-24 reps → Repeat same weight
- 25+ reps → Add weight

If you got 20 reps, you're close! Try again at the same weight and aim for 25+.

### What if I was doing a different progression scheme?

The app analyzes your workout based on the scheme detected in your Hevy routine:

- If your Hevy routine shows "5x3+", it evaluates as T1 Stage A
- If your Hevy routine shows "3x10", it evaluates as T2 Stage A
- If your Hevy routine shows "3x15+", it evaluates as T3

If the detected scheme doesn't match what you were actually doing, you can:
1. Override the stage dropdown (for stage changes)
2. Override the suggested weight
3. Edit your Hevy routine templates to match GZCLP format before importing

### What happens if I made a mistake in Hevy?

If you logged incorrect data in Hevy (wrong weight, wrong reps, etc.):

1. The analysis will be based on that incorrect data
2. You'll see it in the "Lifted" section
3. **Solution**: Override the "Next Target" weight to what you know is correct

The app uses the data as logged in Hevy, so make sure your Hevy workouts are accurate.

### How does the app know which tier an exercise is?

The app determines tier based on the rep scheme in your Hevy routine:

- **T1**: 5x3+, 6x2+, or 10x1+ format
- **T2**: 3x10, 3x8, or 3x6 format
- **T3**: 3x15+, 3x12+, or 3x10+ format (with AMRAP)

Make sure your Hevy routines use these exact schemes for proper analysis.

## Troubleshooting

### "No workout data" appears for all exercises

**Possible causes:**
- You haven't logged workouts for these routines in Hevy yet
- The routine IDs don't match between your Hevy routines and what you selected during import
- Your Hevy workout history doesn't go back far enough

**Solutions:**
- Verify you selected the correct Hevy routines during import
- If you just created the routines in Hevy, the app will use template values (gray cards)
- Manually enter your current weights in the "Next Target" fields

### The suggested weight seems way off

**Possible causes:**
- You logged warmup sets as normal sets in Hevy
- You used a different weight unit (kg vs lbs) in Hevy
- You logged a failed attempt or test max in Hevy

**Solutions:**
- Check the "Lifted" section to see what data the app read
- Override the "Next Target" with the correct weight
- For next time: Use set types in Hevy (warmup, normal, failure) correctly

### The app suggests a stage change but I want to try the same stage again

**No problem!** The app follows strict GZCLP rules, but you can be more flexible:

1. Keep the same weight (the app already suggests this)
2. Change the stage dropdown back to the current stage
3. Give it another try at the same scheme

Just know that official GZCLP recommends stage changes after one failure to maintain consistent volume while managing fatigue.

### The analysis shows success but I felt like I failed

The analysis is purely objective based on reps completed:

- **T1/T2**: Did you hit the minimum reps on all sets? → Success
- **T3**: Did you hit 25+ on AMRAP? → Success

It doesn't account for:
- RPE (rate of perceived exertion)
- Form breakdown
- Grinding reps
- Fatigue accumulation

If you feel like the weight was too hard even though you technically succeeded, you can:
- Keep the same weight instead of progressing
- Reduce the suggested weight slightly
- Trust the process - GZCLP is designed to be conservative

## Tips for Best Results

1. **Keep Hevy workouts clean**: Use proper set types (warmup vs normal) for accurate analysis
2. **Log AMRAP sets correctly**: Always do an AMRAP on the last set of each exercise
3. **Review before completing**: Check all four days before clicking Continue
4. **Trust but verify**: The suggestions are usually right, but you know your body best
5. **Be consistent**: Use the same rep schemes in Hevy that GZCLP expects

## Related Documentation

- [Feature 009 Implementation Plan](../009-intelligent-import-progression.md) - Technical implementation details and task breakdown

---

**Last Updated**: January 8, 2026
