document.addEventListener('DOMContentLoaded', function() {
  const readBtn = document.getElementById('readBtn');
  const resultsDiv = document.getElementById('results');
  const itemsDiv = document.getElementById('items');
  const errorDiv = document.getElementById('error');
  const emptyDiv = document.getElementById('empty');

  readBtn.addEventListener('click', async function() {
    readBtn.disabled = true;
    readBtn.textContent = 'Reading...';
    errorDiv.style.display = 'none';
    resultsDiv.classList.remove('active');
    emptyDiv.style.display = 'none';

    try {
      const items = await navigator.clipboard.read();
      itemsDiv.innerHTML = '';

      if (items.length === 0) {
        emptyDiv.style.display = 'block';
        readBtn.disabled = false;
        readBtn.textContent = 'Read Clipboard';
        return;
      }

      for (const item of items) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const types = item.types;
        const typeDiv = document.createElement('div');
        typeDiv.className = 'item-type';
        typeDiv.textContent = types.join(', ');
        itemDiv.appendChild(typeDiv);

        for (const type of types) {
          if (type === 'text/plain' || type === 'text/html' || type === 'text/uri-list') {
            const blob = await item.getType(type);
            const text = await blob.text();
            const previewDiv = document.createElement('div');
            previewDiv.className = 'item-preview';
            previewDiv.textContent = text.length > 200 ? text.substring(0, 200) + '...' : text;
            itemDiv.appendChild(previewDiv);

            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'item-size';
            sizeDiv.textContent = `${text.length} chars`;
            itemDiv.appendChild(sizeDiv);
            break;
          } else if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'item-size';
            sizeDiv.textContent = `${(blob.size / 1024).toFixed(1)} KB`;
            itemDiv.appendChild(sizeDiv);
            break;
          }
        }

        itemsDiv.appendChild(itemDiv);
      }

      resultsDiv.classList.add('active');
    } catch (err) {
      errorDiv.textContent = 'Error: ' + err.message + '. Make sure to grant clipboard permission.';
      errorDiv.style.display = 'block';
    }

    readBtn.disabled = false;
    readBtn.textContent = 'Read Clipboard';
  });
});
