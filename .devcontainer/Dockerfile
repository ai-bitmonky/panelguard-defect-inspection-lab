# Ready-made image for students: Python 3.13 + every package + the ELPV photos, so a codespace needs no setup.
# Built and pushed by .github/workflows/image.yml to ghcr.io/ai-bitmonky/panelguard-lab
FROM mcr.microsoft.com/devcontainers/python:3.13
COPY tools/takehome/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
 && git clone --depth 1 https://github.com/zae-bayern/elpv-dataset /opt/elpv-dataset \
 && rm -rf /opt/elpv-dataset/.git \
 && chmod -R a+rX /opt/elpv-dataset
