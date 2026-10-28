import net from "node:net";
export function qmpCommand(
  socketPath: string | { host: string; port: number },
  command: "system_powerdown" | "system_reset",
) {
  return new Promise<void>((resolve, reject) => {
    const socket =
      typeof socketPath === "string"
        ? net.createConnection(socketPath)
        : net.createConnection(socketPath);
    let buffer = "",
      settled = false;
    const done = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      error ? reject(error) : resolve();
    };
    socket.setTimeout(5000, () => done(new Error("QEMU monitor timed out")));
    socket.on("error", done);
    socket.on("close", () => {
      if (!settled)
        done(new Error("QEMU monitor closed before acknowledging the action"));
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let line: number;
      while ((line = buffer.indexOf("\n")) >= 0) {
        const text = buffer.slice(0, line);
        buffer = buffer.slice(line + 1);
        try {
          const message = JSON.parse(text);
          if (message.QMP)
            socket.write(
              JSON.stringify({
                execute: "qmp_capabilities",
                id: "capabilities",
              }) + "\r\n",
            );
          else if (message.error)
            done(new Error(message.error.desc || "QEMU rejected the action"));
          else if (message.id === "capabilities")
            socket.write(
              JSON.stringify({ execute: command, id: "action" }) + "\r\n",
            );
          else if (message.id === "action" && "return" in message) done();
        } catch {
          done(new Error("Invalid QEMU monitor response"));
        }
      }
    });
  });
}
