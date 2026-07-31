# Mori web

Static iPhone-first version of the native Mori app. Go and templ generate the
finished site; GitHub Pages serves only the files in `dist`.

## Build

```sh
cd web
templ generate
go run ./cmd/generate
```

## Live development with Air

Both Air and templ are installed in the Go binary folder on this Mac. Run:

```sh
cd web
$(go env GOPATH)/bin/air
```

Open `http://localhost:8090`. Air watches the Go, templ, CSS, and JavaScript
sources. It regenerates the templ output, rebuilds `dist`, restarts the Go
server, and refreshes the browser through its development proxy.

The Go server itself listens on `http://localhost:8080`; port `8090` is the Air
live-reload preview.

## GitHub Pages

The included workflow builds the templ templates and publishes `web/dist`
whenever the default branch is updated. In the GitHub repository settings,
choose **GitHub Actions** as the Pages source.
