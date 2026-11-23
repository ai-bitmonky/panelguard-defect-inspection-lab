#!/bin/sh
# First-start setup for a codespace. Safe to run again:  sh tools/takehome/setup.sh
cd "$(dirname "$0")" || exit 1
if python -c "import tensorflow, sklearn, langgraph, crewai, gradio" 2>/dev/null; then
  echo "Python packages: already installed."
else
  echo "Installing Python packages from PyPI (a few minutes)..."
  pip install --timeout 20 --retries 1 -r requirements.txt || {
    echo "PyPI could not be reached. Trying a PyPI mirror (TUNA, Tsinghua University)..."
    pip install --timeout 60 -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt || {
      echo "Trying a second PyPI mirror (Aliyun)..."
      pip install --timeout 60 -i https://mirrors.aliyun.com/pypi/simple -r requirements.txt || {
        echo "SETUP FAILED: no package index could be reached. Try again later:  sh tools/takehome/setup.sh"; exit 1; }
    }
  }
fi
if [ ! -d elpv-dataset/src/elpv_dataset/data/images ]; then
  if [ -d /opt/elpv-dataset/src/elpv_dataset/data/images ]; then ln -sfn /opt/elpv-dataset elpv-dataset
  else git clone --depth 1 https://github.com/zae-bayern/elpv-dataset || { echo "SETUP FAILED: could not get the photos. Try again:  sh tools/takehome/setup.sh"; exit 1; }
  fi
fi
echo "SETUP DONE. Next:  cd tools/takehome   and run the commands in the README."
