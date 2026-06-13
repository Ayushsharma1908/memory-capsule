document
  .getElementById("exportBtn")
  .addEventListener("click", () => {

    chrome.storage.local.get(
      ["capsules"],
      (result) => {

        const capsules =
          result.capsules || {};

        const blob = new Blob(
          [
            JSON.stringify(
              capsules,
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

        console.log(
          "Exported",
          Object.keys(capsules).length,
          "capsules"
        );
      }
    );

  });