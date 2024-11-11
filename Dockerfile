FROM denoland/deno

EXPOSE 8000

WORKDIR /app

ADD . /app

RUN deno install --entrypoint -A  src/main.ts

CMD ["run", "-A", "src/main.ts"]