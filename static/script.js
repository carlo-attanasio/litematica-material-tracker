let materialsData = [];
let savedProgress = JSON.parse(localStorage.getItem('materialHubProgress')) || {};
let currentFile = "";
let currentFilter = "all";

function getCleanId(rawId) {
    let name = rawId.replace('minecraft:', '');
    if (name.includes('block_of_')) name = name.replace('block_of_', '') + '_block';
    name = name.replace('redstone_comparator', 'comparator');
    name = name.replace('redstone_repeater', 'repeater');
    name = name.replace('redstone_dust', 'redstone');
    name = name.replace('chiselled_', 'chiseled_');
    return name;
}

function formatMinecraftQuantity(amount) {
    if (amount === 0) return "0 Items";
    const ITEMS_PER_STACK = 64, STACKS_PER_SB = 27, SB_PER_CHEST = 27;
    let items = amount % ITEMS_PER_STACK;
    let totalStacks = Math.floor(amount / ITEMS_PER_STACK);
    let stacks = totalStacks % STACKS_PER_SB;
    let totalSBs = Math.floor(totalStacks / STACKS_PER_SB);
    let sbs = totalSBs % SB_PER_CHEST;
    let chests = Math.floor(totalSBs / SB_PER_CHEST);
    
    let parts = [];
    if (chests > 0) parts.push(`${chests} Chest of SB`);
    if (sbs > 0) parts.push(`${sbs} SB`);
    if (stacks > 0) parts.push(`${stacks} Stacks`);
    if (items > 0) parts.push(`${items} Items`);
    return parts.join(", ");
}

function formatName(rawItem) {
    const exceptions = ['of', 'with', 'and', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an'];
    let words = rawItem.replace('minecraft:', '').split('_');
    return words.map((word, index) => {
        if (index > 0 && exceptions.includes(word.toLowerCase())) {
            return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function updateGlobalProgress() {
    if (materialsData.length === 0) return;
    let totalNeeded = 0, totalGathered = 0;
    materialsData.forEach(item => {
        totalNeeded += item.TotalEstimate;
        totalGathered += (savedProgress[currentFile + "_" + item.RawItem] || 0);
    });
    const percent = totalNeeded === 0 ? 0 : ((totalGathered / totalNeeded) * 100);
    document.getElementById('globalPercentText').textContent = percent.toFixed(2);
    document.getElementById('globalProgressBar').style.width = `${percent}%`;
}

function setFilter(filterType, evt) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    renderMaterials();
}

function toggleCompletion(evt, rawId, total) {
    let gathered = evt.target.checked ? total : 0;
    savedProgress[currentFile + "_" + rawId] = gathered;
    localStorage.setItem('materialHubProgress', JSON.stringify(savedProgress));
    updateGlobalProgress();
    renderMaterials();
}

function startDrag(e, rawId, total) {
    e.preventDefault();
    let container = e.currentTarget;
    let key = currentFile + "_" + rawId;
    let gathered = savedProgress[key] || 0;
    
    function updateProgress(evt) {
        let rect = container.getBoundingClientRect();
        let pct = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));
        gathered = Math.round(pct * total);
        
        let pBar = document.getElementById(`bar-${rawId}`);
        let gatheredTextElem = document.getElementById(`gathered-text-${rawId}`);
        let checkbox = document.getElementById(`check-${rawId}`);
        let cardElem = document.getElementById(`card-${rawId}`);
        
        pBar.style.width = `${(gathered / total) * 100}%`;
        gatheredTextElem.textContent = formatMinecraftQuantity(gathered);
        
        if (gathered >= total) {
            pBar.classList.add('completed');
            checkbox.checked = true;
            cardElem.classList.add('completed-bg');
        } else {
            pBar.classList.remove('completed');
            checkbox.checked = false;
            cardElem.classList.remove('completed-bg');
        }
    }
    
    updateProgress(e);
    
    function onMouseMove(evt) { updateProgress(evt); }
    function stopDrag() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', stopDrag);
        savedProgress[key] = gathered;
        localStorage.setItem('materialHubProgress', JSON.stringify(savedProgress));
        updateGlobalProgress();
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopDrag);
}

function renderMaterials() {
    const container = document.getElementById('materialList');
    container.innerHTML = '';
    
    materialsData.sort((a, b) => b.TotalEstimate - a.TotalEstimate);

    materialsData.forEach(item => {
        const rawId = item.RawItem;
        const total = item.TotalEstimate;
        const gathered = savedProgress[currentFile + "_" + rawId] || 0;
        
        if (currentFilter === 'completed' && gathered < total) return;
        if (currentFilter === 'in-progress' && (gathered === 0 || gathered >= total)) return;
        if (currentFilter === 'not-started' && gathered > 0) return;
        
        const pctText = (total === 0 ? 0 : (gathered / total) * 100).toFixed(1);
        const cleanName = getCleanId(rawId);
        const isCompleted = gathered >= total;
        
        const fallbackGif = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
        
        const card = document.createElement('div');
        card.id = `card-${rawId}`;
        card.className = `material-card ${isCompleted ? 'completed-bg' : ''}`;
        
        card.innerHTML = `
            <img src="https://mcitemgallery.com/images-v2/1.21.1/${cleanName}.png" 
                 onerror="this.onerror=null; this.src='${fallbackGif}';"
                 class="item-icon" 
                 alt="${formatName(rawId)}">
            <div class="material-content">
                <div class="material-header">
                    <h3>${formatName(rawId)}</h3>
                </div>
                <p>Total: ${formatMinecraftQuantity(total)}</p>
                <p class="gathered-text">Gathered: <span id="gathered-text-${rawId}">${formatMinecraftQuantity(gathered)}</span></p>
                <div class="progress-row">
                    <div class="progress-bar-container interactive" onmousedown="startDrag(event, '${rawId}', ${total})">
                        <div class="progress-bar ${isCompleted ? 'completed' : ''}" id="bar-${rawId}" style="width: ${pctText}%;"></div>
                    </div>
                    <input type="checkbox" class="completion-checkbox" id="check-${rawId}" ${isCompleted ? 'checked' : ''} onchange="toggleCompletion(event, '${rawId}', ${total})">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    updateGlobalProgress();
}

function loadFile() {
    const select = document.getElementById('fileSelect');
    currentFile = select.value;
    if (!currentFile) return;
    fetch('/api/file/' + currentFile)
        .then(response => response.json())
        .then(data => {
            materialsData = data;
            renderMaterials();
        });
}

function fetchFilesList(targetFile = null) {
    fetch('/api/files')
        .then(response => response.json())
        .then(files => {
            const select = document.getElementById('fileSelect');
            select.innerHTML = '';
            if (files.length === 0) {
                const option = document.createElement('option');
                option.text = "No files found";
                option.value = "";
                select.appendChild(option);
                materialsData = [];
                renderMaterials();
                return;
            }
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.text = file;
                select.appendChild(option);
            });
            if (targetFile && files.includes(targetFile)) {
                select.value = targetFile;
            }
            loadFile();
        });
}

fetchFilesList();

document.getElementById('changeDirBtn').addEventListener('click', () => {
    fetch('/api/directory')
        .then(res => res.json())
        .then(data => {
            let newDir = prompt("Enter the folder path:", data.directory);
            if (newDir && newDir !== data.directory) {
                fetch('/api/directory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ directory: newDir })
                })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        fetchFilesList();
                    }
                });
            }
        });
});

document.getElementById('addFileBtn').addEventListener('click', () => {
    document.getElementById('fileUpload').click();
});

document.getElementById('fileUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, content: evt.target.result })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fetchFilesList(data.filename);
            }
        });
        e.target.value = '';
    };
    reader.readAsText(file);
});

document.getElementById('renameFileBtn').addEventListener('click', () => {
    if (!currentFile) return;
    const select = document.getElementById('fileSelect');
    const currentDisplayName = select.options[select.selectedIndex].text;
    let newName = prompt("Enter new name:", currentDisplayName);
    if (!newName || newName === currentDisplayName) return;
    if (!newName.endsWith('.txt')) {
        newName += '.txt';
    }
    fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_name: currentFile, new_name: newName })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            migrateProgress(currentFile, data.new_name);
            fetchFilesList(data.new_name);
        }
    });
});

function migrateProgress(oldPrefix, newPrefix) {
    const keys = Object.keys(savedProgress);
    let changed = false;
    keys.forEach(key => {
        if (key.startsWith(oldPrefix + "_")) {
            const suffix = key.substring(oldPrefix.length);
            savedProgress[newPrefix + suffix] = savedProgress[key];
            delete savedProgress[key];
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem('materialHubProgress', JSON.stringify(savedProgress));
    }
}