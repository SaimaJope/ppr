# PPR-sivuston sisällönhallinnan käyttöönotto

Sivusto toimii näin:

- Kaikki muokattava sisältö on yhdessä tiedostossa: **`content/fi.json`**. Sivut
  (`*.dc.html`) hakevat sen selaimessa välimuistin ohi (`?v=aikaleima` +
  `cache: "no-store"`), joten muutos näkyy heti kun GitHub Pages on julkaissut
  uuden version (yleensä alle minuutissa).
- Hallintapaneeli on **Cloudflare Worker** (`worker/`-kansio). Se tallentaa
  muokatun `fi.json`-tiedoston ja ladatut kuvat suoraan tämän repon
  `main`-haaraan GitHubin REST-rajapinnalla. GitHub-token on vain Workerin
  salaisuuksissa – se ei koskaan päädy selaimeen.

## 1. Luo fine-grained PAT (GitHub-token)

1. Kirjaudu GitHubiin tilillä, jolla on kirjoitusoikeus repoon `SaimaJope/ppr`.
2. Avaa **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
3. Täytä:
   - **Token name:** esim. `ppr-admin-worker`
   - **Expiration:** esim. 1 vuosi (laita kalenteriin muistutus uusimisesta –
     kun token vanhenee, tallennus lakkaa toimimasta ja paneeli näyttää
     virheen "käyttöoikeus puuttuu tai token on vanhentunut")
   - **Resource owner:** `SaimaJope`
   - **Repository access:** *Only select repositories* → valitse **`SaimaJope/ppr`**
   - **Permissions → Repository permissions → Contents: Read and write**
     (mitään muuta oikeutta ei tarvita)
4. Paina **Generate token** ja kopioi token talteen – se näytetään vain kerran.

## 2. Aseta Workerin salaisuudet

Tarvitset [Node.js](https://nodejs.org):n. Aja `worker/`-kansiossa:

```powershell
cd worker
npx wrangler login          # avaa selaimen, kirjaudu Cloudflare-tilille
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GITHUB_TOKEN
```

Jokainen komento kysyy arvon:

- **ADMIN_PASSWORD** – hallintapaneelin kirjautumissalasana. Valitse pitkä ja
  vahva (tämä on paneelin ainoa suoja).
- **SESSION_SECRET** – pitkä satunnainen merkkijono, jolla istuntoevästeet
  allekirjoitetaan. Generoi esim. PowerShellissä:

  ```powershell
  -join ((1..48) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
  ```

- **GITHUB_TOKEN** – kohdassa 1 luotu fine-grained PAT.

Huom: jos Worker on jo julkaistu, `secret put` ottaa uuden arvon käyttöön heti.
Salasanan tai tokenin vaihto tehdään samalla komennolla uudestaan.

## 3. Julkaise Worker

```powershell
cd worker
npx wrangler deploy
```

Komento tulostaa osoitteen muotoa `https://ppr-admin.<tili>.workers.dev` –
tämä on hallintapaneelin osoite, jonka voit antaa asiakkaalle.

## 4. Testaa

1. Avaa Workerin osoite, kirjaudu ADMIN_PASSWORD-salasanalla.
2. Muuta jotain tekstiä ja paina **Tallenna muutokset** → paneeli näyttää
   "Tallennettu!" ja repoon syntyy commit *"Sisältöpäivitys hallintapaneelista"*.
3. Avaa <https://saimajope.github.io/ppr/> noin minuutin päästä ja tarkista
   että muutos näkyy.
4. **Esikatselu**-nappi avaa valitun sivun uuteen välilehteen tallentamattomilla
   muutoksilla. (Toimii vasta kun tämän repon uusi versio – JSONista renderöivät
   sivut – on julkaistu GitHub Pagesiin.)

## Palautukset

Jokainen tallennus on Git-commit `main`-haarassa, joten mikä tahansa aiempi
versio voidaan palauttaa:

```powershell
git log --oneline -- content/fi.json        # etsi palautettava versio
git checkout <commit> -- content/fi.json    # palauta tiedosto
git commit -m "Palauta aiempi sisältö" ; git push
```

## Hyvä tietää

- Kirjautumisyrityksiä rajoitetaan (5 yritystä / 15 min / IP). Rajoitin on
  Worker-instanssikohtainen eli suuntaa-antava – varsinainen suoja on vahva
  salasana ja epäonnistuneen yrityksen viive.
- Istunto on voimassa 24 tuntia, minkä jälkeen paneeli pyytää kirjautumaan
  uudelleen.
- Kuvalataukset hyväksyvät vain JPG/PNG/WEBP-tiedostot, enintään 2 Mt, ja ne
  committoituvat `assets/`-kansioon uudella tiedostonimellä (vanhoja ei
  ylikirjoiteta).
- Paikalliskehitys: `worker/.dev.vars` (ei versionhallinnassa) + `npx wrangler dev`.
