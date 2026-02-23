#!/bin/sh
set -e

# ZeitFlow CLI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/benzend/zeitflow/main/install.sh | sh

REPO="benzend/zeitflow"
BINARY="zeitflow"

main() {
  os=$(detect_os)
  arch=$(detect_arch)
  artifact="${BINARY}-${os}-${arch}"

  # Determine version
  if [ -n "$VERSION" ]; then
    tag="$VERSION"
  else
    tag=$(latest_tag)
  fi

  echo "Installing zeitflow ${tag} for ${os}/${arch}..."

  # Download and extract
  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT

  if [ "$os" = "windows" ]; then
    url="https://github.com/${REPO}/releases/download/${tag}/${artifact}.zip"
    curl -fsSL "$url" -o "${tmpdir}/zeitflow.zip"
    unzip -q "${tmpdir}/zeitflow.zip" -d "$tmpdir"
  else
    url="https://github.com/${REPO}/releases/download/${tag}/${artifact}.tar.gz"
    curl -fsSL "$url" -o "${tmpdir}/zeitflow.tar.gz"
    tar xzf "${tmpdir}/zeitflow.tar.gz" -C "$tmpdir"
  fi

  # Install
  install_dir="${INSTALL_DIR:-/usr/local/bin}"
  if [ -w "$install_dir" ]; then
    mv "${tmpdir}/zeitflow" "${install_dir}/zeitflow"
  else
    echo "Installing to ${install_dir} (requires sudo)..."
    sudo mv "${tmpdir}/zeitflow" "${install_dir}/zeitflow"
  fi
  chmod +x "${install_dir}/zeitflow"

  echo ""
  echo "zeitflow installed to ${install_dir}/zeitflow"
  "${install_dir}/zeitflow" --version
  echo ""
  echo "Get started:"
  echo "  zeitflow auth login       # authenticate"
  echo "  zeitflow setup mcp        # configure your IDE"
  echo "  zeitflow workflow list    # list workflows"
}

detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "macos" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)   echo "x86_64" ;;
    aarch64|arm64)   echo "aarch64" ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
  esac
}

latest_tag() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" |
    grep '"tag_name"' |
    sed 's/.*"tag_name": "//;s/".*//'
}

main
