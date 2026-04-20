# BONELAB Clipboard Text Enabler — UnityExplorer REPL Guide

A guide for enabling clipboard text objects in BONELAB using the UnityExplorer REPL console, useful for documenting the in-game lore clipboards without needing to pick them up.


# TLDR

Once you find some clipboards paste the following into the REPL input area and click **Run**:

```csharp
var all = Resources.FindObjectsOfTypeAll<GameObject>();
for (int i = 0; i < all.Length; i++) {
    if (all[i].name == "textTitle" || all[i].name == "textBody") {
        all[i].SetActive(true);
        all[i].transform.parent.gameObject.SetActive(true);
        all[i].transform.parent.parent.gameObject.SetActive(true);
    }
}
```

---

## Background

BONELAB's lore clipboards contain two text objects — `textTitle` and `textBody` — that are children of a `Text` GameObject nested inside the clipboard prefab. These text objects are **disabled by default** and only activate when the player picks up the clipboard. Additionally, Unity's optimization systems will reset object states when the player moves away, causing previously enabled text to become inactive again.

The hierarchy of each clipboard looks like this:

```
Clipboard_Lore [+n]
  └── Text
        ├── textTitle
        └── textBody
```

---

## Requirements

- **BONELAB** (PC)
- **MelonLoader** installed
- **UnityExplorer** mod installed and active in-game

---

## How to Open the REPL Console

1. Launch BONELAB with MelonLoader and UnityExplorer active
2. Open the UnityExplorer overlay (default key: `F7`)
3. Navigate to the **C# Console** tab
4. Make sure you are in **REPL** mode (not the Script tab)

> **Note:** The REPL has specific limitations. It does not support `using` directives or class definitions. All code must be written as top-level statements. The REPL provides built-in helpers including `Log()` for logging and `Start()` for running coroutines.

---

## The Script

Paste the following into the REPL input area and click **Run**:

```csharp
var all = Resources.FindObjectsOfTypeAll<GameObject>();
for (int i = 0; i < all.Length; i++) {
    if (all[i].name == "textTitle" || all[i].name == "textBody") {
        all[i].SetActive(true);
        all[i].transform.parent.gameObject.SetActive(true);
        all[i].transform.parent.parent.gameObject.SetActive(true);
    }
}
```

### What it does

- `Resources.FindObjectsOfTypeAll<GameObject>()` — finds all GameObjects currently loaded in memory, including inactive ones
- The `for` loop iterates over every object and checks for the names `textTitle` and `textBody`
- For each match, it enables the object itself (`textTitle`/`textBody`), its parent (`Text`), and its grandparent (`Clipboard_Lore`)

---

## Usage Workflow

Because BONELAB's optimization systems can disable objects again as you move around the level, the script is designed to be **re-run manually** each time you approach a new clipboard or the text disappears.

Recommended workflow for documentation:

1. Walk up close to a clipboard in-game
2. Open the UnityExplorer overlay
3. Paste and run the script in the REPL
4. Close the overlay and take your screenshot
5. Repeat for each clipboard location

> **Tip:** The script acts on all clipboards currently loaded in memory, not just the nearest one, so a single run may enable multiple clipboards at once if they are all within the loaded area.

---

## Troubleshooting

### Text still not visible after running

The clipboard may not be loaded into memory yet. Walk closer to it and re-run the script. Objects that have never been near the player may not appear in `FindObjectsOfTypeAll` results.

### Verifying the script is finding objects

Use this diagnostic version to check how many objects are being found and whether the text objects are being detected:

```csharp
var all = Resources.FindObjectsOfTypeAll<GameObject>();
var found = 0;
for (int i = 0; i < all.Length; i++) {
    if (all[i].name == "textTitle" || all[i].name == "textBody") {
        Log("Found: " + all[i].name + " | Active: " + all[i].activeSelf);
        found++;
    }
}
Log("Total found: " + found);
```

If `Total found: 0` is logged, the clipboards are not loaded into memory yet.

### Verifying objects are enabling correctly

Use this version to confirm the full hierarchy is being activated:

```csharp
var all = Resources.FindObjectsOfTypeAll<GameObject>();
for (int i = 0; i < all.Length; i++) {
    if (all[i].name == "textTitle" || all[i].name == "textBody") {
        all[i].SetActive(true);
        all[i].transform.parent.gameObject.SetActive(true);
        all[i].transform.parent.parent.gameObject.SetActive(true);
        Log("Enabled: " + all[i].name + " | ActiveInHierarchy: " + all[i].activeInHierarchy);
    }
}
```

If `ActiveInHierarchy` logs as `false` after enabling, there may be a parent higher up in the hierarchy that is also inactive.

---

## REPL Limitations

The UnityExplorer REPL has several restrictions worth knowing if you want to modify this script:

| Not supported | Supported |
|---|---|
| `using` directives | `var` and explicit types |
| Class definitions | `for` / `while` loops |
| Top-level method definitions | Built-in `Log()` helper |
| Bare executable statements before method definitions | Built-in `Start()` coroutine helper |

---

## Credits

Script developed through iterative testing with the UnityExplorer REPL in BONELAB. Object hierarchy identified via the UnityExplorer Object Explorer.
