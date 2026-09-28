# Cuphouder – informatiewebsite

## Structuur
```
cuphouder-site/
├── index.html          Het product (homepagina)
├── duurzaamheid.html   Duurzaamheid
├── over-ons.html       Over ons
├── css/
│   └── style.css       Alle styling
├── js/
│   ├── theme.js        Laadt licht/donker-keuze (in <head>)
│   └── main.js         Licht/donker-knop en hamburgermenu
└── assets/
    └── img/            Foto's van het product en team
```

## Lokaal draaien
```
cd cuphouder-site
python -m http.server 8000
```
Open http://localhost:8000

Of in VS Code: rechtsklik `index.html` > Open with Live Server.

## Nog in te vullen
Zoek in `duurzaamheid.html` op `class="todo"`: materiaal en recyclingresultaten.
