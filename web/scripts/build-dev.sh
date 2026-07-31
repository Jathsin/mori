#!/bin/sh
set -eu

templ_bin="$(go env GOPATH)/bin/templ"

if [ ! -x "$templ_bin" ]; then
  echo "templ is not installed at $templ_bin" >&2
  echo "Install it, then restart Air." >&2
  exit 1
fi

"$templ_bin" generate
go run ./cmd/generate
go build -o ./tmp/memore ./cmd/dev
