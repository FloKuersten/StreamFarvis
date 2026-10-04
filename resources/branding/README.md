# StreamFarvis app icon

The coral ribbon combines an S silhouette with a play-shaped opening. A charcoal background keeps it distinct on light and dark launchers.

- `streamfarvis-mark-source.png`: full-resolution transparent artwork.
- `../../public/streamfarvis-icon.png`: 1024px presentation and web icon.
- `../../public/streamfarvis-mark.png`: transparent mark without outer canvas padding.
- Android `drawable-nodpi/streamfarvis_icon.png`: 432px adaptive foreground, with a maximum symbol height of 53dp in a 108dp viewport.
- Android `drawable-nodpi/streamfarvis_icon_monochrome.png`: matching alpha silhouette for themed icons.
- Android legacy launcher exports: 48, 72, 96, 144 and 192px, in rounded-square and circular forms.

The Android adaptive background is `#101116`. Retain transparent padding when exporting adaptive foregrounds: the launcher applies its own mask. The legacy images already include their background and mask. The retained Streambert desktop artwork is separate from this Android identity.
