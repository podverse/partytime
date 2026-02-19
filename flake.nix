{
  description = "Podverse Partytime (RSS/Podcast 2.0 parser) development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_24
          git
        ];
        shellHook = ''
          echo "Partytime (podverse-partytime) dev shell"
          echo "  npm install    # install deps"
          echo "  npm run build  # build"
          echo "  npm run test   # test"
        '';
      };
    });
}
