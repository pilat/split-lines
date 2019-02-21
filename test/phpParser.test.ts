import { applyEditCase } from "./common";


suite("Php Language Parser Test", () => {
    test('Align and concatenation', async () => {
        const text = `<?php

$text="line1\\r\\n" .
      "line2\\r\\n" .
      "line3\\r\\n";
`;
        const expected = `<?php

$text="line" .
      "1\\r\\n" .
      "line2\\r\\n" .
      "line3\\r\\n";
`
        await applyEditCase('php', text, expected, [2, 11])
    });

    test('Test with 2nd two', async () => {
        const text = `<?php

$text="line1+" .
      "line2+" .
      "line3+";
`
        const expected = `<?php

$text="line1+" .
      "line" .
      "2+" .
      "line3+";
`
        await applyEditCase('php', text, expected, [3, 11])
    });
});
