// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "StoicGift",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "StoicGift", targets: ["StoicGift"])
    ],
    targets: [
        .executableTarget(
            name: "StoicGift",
            path: "StoicGift"
        )
    ]
)
