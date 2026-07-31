package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"memore-web/views"
)

func main() {
	if err := os.RemoveAll("dist"); err != nil {
		panic(err)
	}
	if err := os.MkdirAll("dist/assets", 0o755); err != nil {
		panic(err)
	}

	index, err := os.Create("dist/index.html")
	if err != nil {
		panic(err)
	}
	defer index.Close()

	if err := views.Page().Render(context.Background(), index); err != nil {
		panic(err)
	}

	for _, name := range []string{
		"app.css",
		"app.js",
		"htmx.min.js",
		"inter.ttf",
		"crimson-regular.ttf",
		"crimson-semibold.ttf",
		"gael.jpeg",
		"juanmi.png",
		"juanmi-2026.jpg",
		"icon.svg",
		"icon.png",
		"manifest.webmanifest",
		"service-worker.js",
	} {
		if err := copyFile(filepath.Join("static", name), filepath.Join("dist", "assets", name)); err != nil {
			panic(err)
		}
	}

	fmt.Println("Memore exported to web/dist")
}

func copyFile(source, destination string) error {
	src, err := os.Open(source)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	return err
}
