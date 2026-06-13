document.getElementById("exportBtn")
  .addEventListener("click", () => {

    chrome.storage.local.get(
      ["memoryCapsule"],
      (result) => {

        const messages =
          result.memoryCapsule || [];

        const blob = new Blob(
          [
            JSON.stringify(
              messages,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement("a");

        a.href = url;

        a.download =
          "memory-capsule.json";

        a.click();

        URL.revokeObjectURL(url);
      }
    );

});