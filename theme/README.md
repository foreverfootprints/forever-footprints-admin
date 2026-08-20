# Theme snippets

This isn't the theme repo (theme edits happen directly in the Shopify theme
editor via Custom Liquid blocks, not through a deployed codebase). This
folder just keeps a version-controlled backup of Liquid snippets pasted into
the theme, since the theme editor itself doesn't give real history.

## frame-product-options/custom-frame-options.liquid

Installed as a Custom Liquid block, right before the "Add to cart" button,
on the shared "frames" template used by all frame products. Shows Name /
Birthdate / Date passed fields by default, except for the product tagged
`no-name-dates` (currently "Forever Footprints Memorial Frame"), which
skips them.

If you change the fields in Shopify's theme editor, copy the updated block
back into this file (and commit) so there's a record of what's actually
live.
