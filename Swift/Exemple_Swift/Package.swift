// swift-tools-version:5.9
// SmaRTC Swift SDK Example
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

import PackageDescription

let package = Package(
    name: "SmaRTCSwiftExample",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    dependencies: [
        // SignalR Client for Swift
        .package(url: "https://github.com/moozzyk/SignalR-Client-Swift.git", from: "0.9.0"),
    ],
    targets: [
        .executableTarget(
            name: "SmaRTCSwiftExample",
            dependencies: [
                .product(name: "SignalRClient", package: "SignalR-Client-Swift"),
            ],
            path: "Sources"
        ),
    ]
)
