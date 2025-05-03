// 전역 변수 선언
let canvas;
let canvasHistory = [];
let currentHistoryIndex = -1;
const maxHistorySteps = 30;
let activeToolType = null; // 현재 활성화된 도구 타입

// 캔버스 초기화
document.addEventListener('DOMContentLoaded', function() {
    try {
        initCanvasWithDefaults();
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
        // 기본적으로 일반 속성 패널 표시
        const generalProperties = document.getElementById('general-properties');
        if (generalProperties) {
            showPropertySection('general-properties');
        }
    } catch (error) {
        console.error('캔버스 초기화 오류:', error);
    }
});

// 기본 캔버스 초기화 함수
function initCanvasWithDefaults() {
    const canvasElement = document.getElementById('design-canvas');
    if (!canvasElement) {
        console.error('캔버스 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 캔버스 크기 설정 (16:9 비율 권장)
    const widthInput = document.getElementById('canvas-width');
    const heightInput = document.getElementById('canvas-height');
    
    // 기본 크기 설정 (입력 필드가 없을 경우 기본값 사용)
    let width = 1920; // 기본 너비
    let height = 1080; // 기본 높이
    
    // 입력 필드가 존재하는 경우에만 값을 읽음
    if (widthInput) {
        width = parseInt(widthInput.value) || width;
    }
    
    if (heightInput) {
        height = parseInt(heightInput.value) || height;
    }
    
    // 16:9 비율 유지
    if (width / height !== 16 / 9) {
        // 너비를 기준으로 높이 계산
        height = Math.round(width * 9 / 16);
        if (heightInput) {
            heightInput.value = height;
        }
    }
    
    console.log(`캔버스 초기화: ${width}x${height}`);
    
    // Fabric.js 캔버스 생성
    if (canvas) {
        canvas.dispose();
    }
    
    canvas = new fabric.Canvas('design-canvas', {
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        centeredRotation: true,
        centeredScaling: true
    });
    
    // 캔버스 크기 설정
    canvasElement.width = width;
    canvasElement.height = height;
    
    // 캔버스 컨테이너 크기 조정
    adjustCanvasContainer();
    
    // 초기 상태 저장
    saveCanvasState();
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        adjustCanvasContainer();
    });
}

// 캔버스 컨테이너 크기 조정 함수
function adjustCanvasContainer() {
    const container = document.querySelector('.canvas-container');
    if (!container || !canvas) return;
    
    try {
        // 컨테이너 크기 계산
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 더 정확한 스케일 계산
        const scaleX = containerWidth / canvasWidth;
        const scaleY = containerHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95%로 약간 여백 추가
        
        // 캔버스 스케일 설정
        canvas.setZoom(scale);
        canvas.setDimensions({
            width: canvasWidth * scale,
            height: canvasHeight * scale
        });
        
        console.log(`캔버스 크기 조정: 컨테이너=${containerWidth}x${containerHeight}, 스케일=${scale.toFixed(2)}`);
    } catch (error) {
        console.error('캔버스 크기 조정 오류:', error);
    }
}

// 캔버스 크기 업데이트
function updateCanvasSize() {
    const widthInput = document.getElementById('canvas-width');
    const heightInput = document.getElementById('canvas-height');
    
    if (!widthInput || !heightInput) {
        console.error('캔버스 크기 입력 필드를 찾을 수 없습니다.');
        return;
    }
    
    let width = parseInt(widthInput.value) || 1280;
    let height = parseInt(heightInput.value) || 720;
    
    // 최소/최대 범위 제한
    width = Math.min(Math.max(width, 320), 3840);
    height = Math.min(Math.max(height, 180), 2160);
    
    widthInput.value = width;
    heightInput.value = height;
    
    // 캔버스 크기 설정
    canvas.setWidth(width);
    canvas.setHeight(height);
    
    // 캔버스 컨테이너 크기 조정
    adjustCanvasContainer();
    
    canvas.renderAll();
    saveCanvasState();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 텍스트 추가 버튼
    const addTextBtn = document.getElementById('add-text');
    if (addTextBtn) {
        addTextBtn.addEventListener('click', function() {
            activeToolType = 'text';
            hideAllPropertySections();
            showPropertySection('text-properties');
            addText('텍스트를 입력하세요');
        });
    }
    
    // 이미지 추가 버튼
    const addImageBtn = document.getElementById('add-image');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function() {
            activeToolType = 'image';
            hideAllPropertySections();
            showPropertySection('image-properties');
            document.getElementById('image-upload').click();
        });
    }
    
    // 이미지 파일 업로드 처리
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const imgUrl = event.target.result;
                    addImage(imgUrl);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 배경 이미지 추가 버튼
    const addBackgroundBtn = document.getElementById('add-background');
    if (addBackgroundBtn) {
        addBackgroundBtn.addEventListener('click', function() {
            activeToolType = 'background';
            hideAllPropertySections();
            showPropertySection('image-properties');
            document.getElementById('background-upload').click();
        });
    }
    
    // 배경 이미지 파일 업로드 처리
    const backgroundUpload = document.getElementById('background-upload');
    if (backgroundUpload) {
        backgroundUpload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const imgUrl = event.target.result;
                    setBackgroundImage(imgUrl);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 도형 추가 버튼
    const addShapeBtn = document.getElementById('add-shape');
    if (addShapeBtn) {
        addShapeBtn.addEventListener('click', function() {
            activeToolType = 'shape';
            hideAllPropertySections();
            showPropertySection('shape-properties');
            
            try {
                const shapeModal = new bootstrap.Modal(document.getElementById('shape-modal'));
                shapeModal.show();
            } catch (error) {
                console.error('모달 표시 오류:', error);
                // 모달 오류 시 기본 사각형 추가
                addShape('rect');
            }
        });
    }
    
    // 도형 선택 이벤트
    document.querySelectorAll('.shape-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const shapeType = this.getAttribute('data-shape');
            addShape(shapeType);
            
            try {
                const modal = bootstrap.Modal.getInstance(document.getElementById('shape-modal'));
                if (modal) modal.hide();
            } catch (error) {
                console.error('모달 닫기 오류:', error);
            }
        });
    });
    
    // 메뉴 테이블 추가 버튼
    const addMenuTableBtn = document.getElementById('add-menu-table');
    if (addMenuTableBtn) {
        addMenuTableBtn.addEventListener('click', function() {
            activeToolType = 'menu-table';
            hideAllPropertySections();
            showPropertySection('menu-table-properties');
            addMenuTable();
        });
    }
    
    // 선택 객체 삭제 버튼
    const deleteObjectBtn = document.getElementById('delete-object');
    if (deleteObjectBtn) {
        deleteObjectBtn.addEventListener('click', function() {
            deleteSelectedObject();
        });
    }
    
    // 실행 취소 버튼
    const undoBtn = document.getElementById('undo');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            undo();
        });
    }
    
    // 다시 실행 버튼
    const redoBtn = document.getElementById('redo');
    if (redoBtn) {
        redoBtn.addEventListener('click', function() {
            redo();
        });
    }
    
    // 맨 앞으로 가져오기 버튼
    const bringFrontBtn = document.getElementById('bring-front');
    if (bringFrontBtn) {
        bringFrontBtn.addEventListener('click', function() {
            bringToFront();
        });
    }
    
    // 맨 뒤로 보내기 버튼
    const sendBackBtn = document.getElementById('send-back');
    if (sendBackBtn) {
        sendBackBtn.addEventListener('click', function() {
            sendToBack();
        });
    }
    
    // 저장 버튼
    const saveDesignBtn = document.getElementById('save-design');
    if (saveDesignBtn) {
        saveDesignBtn.addEventListener('click', function() {
            saveDesign();
        });
    }
    
    // 캔버스 속성 변경 이벤트
    const canvasWidthInput = document.getElementById('canvas-width');
    if (canvasWidthInput) {
        canvasWidthInput.addEventListener('change', function() {
            updateCanvasSize();
        });
    }
    
    const canvasHeightInput = document.getElementById('canvas-height');
    if (canvasHeightInput) {
        canvasHeightInput.addEventListener('change', function() {
            updateCanvasSize();
        });
    }
    
    const canvasBackgroundInput = document.getElementById('canvas-background');
    if (canvasBackgroundInput) {
        canvasBackgroundInput.addEventListener('change', function() {
            canvas.backgroundColor = this.value;
            canvas.renderAll();
            saveCanvasState();
        });
    }
    
    // 텍스트 속성 변경 이벤트
    const textContentInput = document.getElementById('text-content');
    if (textContentInput) {
        textContentInput.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('text', this.value);
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 캔버스 객체 선택 이벤트
    if (canvas) {
        canvas.on('selection:created', function(options) {
            updatePropertiesPanel(options.target);
        });
        
        canvas.on('selection:updated', function(options) {
            updatePropertiesPanel(options.target);
        });
        
        canvas.on('selection:cleared', function() {
            hideAllPropertySections();
            if (activeToolType) {
                // 활성 도구가 있으면 해당 속성 패널 유지
                showPropertySection(activeToolType + '-properties');
            } else {
                // 없으면 일반 속성 패널 표시
                showPropertySection('general-properties');
            }
        });
        
        // 객체 수정 후 상태 저장
        canvas.on('object:modified', function() {
            saveCanvasState();
        });
    }
}

// 텍스트 추가 함수
function addText(text) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return null;
    }

    try {
        const textObj = new fabric.IText(text, {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#000000',
            originX: 'center',
            originY: 'center',
            textAlign: 'center'
        });
        
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.renderAll();
        saveCanvasState();
        
        return textObj;
    } catch (error) {
        console.error('텍스트 추가 오류:', error);
        return null;
    }
}

// 이미지 추가 함수
function addImage(url) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        fabric.Image.fromURL(url, function(img) {
            // 이미지 크기 조정
            const maxWidth = canvas.width / 3;
            const maxHeight = canvas.height / 3;
            
            if (img.width > maxWidth || img.height > maxHeight) {
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                img.scale(scale);
            }
            
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveCanvasState();
        });
    } catch (error) {
        console.error('이미지 추가 오류:', error);
    }
}

// 배경 이미지 설정 함수
function setBackgroundImage(url) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        fabric.Image.fromURL(url, function(img) {
            // 캔버스에 맞게 이미지 크기 조정
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            img.scale(scale);
            
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                selectable: true,
                data: { type: 'background-image' }
            });
            
            canvas.add(img);
            canvas.sendToBack(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveCanvasState();
        });
    } catch (error) {
        console.error('배경 이미지 설정 오류:', error);
    }
}

// 도형 추가 함수
function addShape(shapeType) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return null;
    }

    try {
        let shapeObj;
        
        switch (shapeType) {
            case 'rect':
                shapeObj = new fabric.Rect({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    width: 100,
                    height: 100,
                    fill: '#4CAF50',
                    originX: 'center',
                    originY: 'center'
                });
                break;
                
            case 'circle':
                shapeObj = new fabric.Circle({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    radius: 50,
                    fill: '#2196F3',
                    originX: 'center',
                    originY: 'center'
                });
                break;
                
            case 'triangle':
                shapeObj = new fabric.Triangle({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    width: 100,
                    height: 100,
                    fill: '#FF9800',
                    originX: 'center',
                    originY: 'center'
                });
                break;
        }
        
        if (shapeObj) {
            canvas.add(shapeObj);
            canvas.setActiveObject(shapeObj);
            canvas.renderAll();
            saveCanvasState();
            return shapeObj;
        }
    } catch (error) {
        console.error('도형 추가 오류:', error);
        return null;
    }
}

// 선택된 객체 삭제 함수
function deleteSelectedObject() {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        const activeObject = canvas.getActiveObject();
        
        if (activeObject) {
            canvas.remove(activeObject);
            canvas.renderAll();
            saveCanvasState();
        }
    } catch (error) {
        console.error('객체 삭제 오류:', error);
    }
}

// 캔버스 이력 관리 함수들
function saveCanvasState() {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        // 현재 상태 이후의 이력 제거
        if (currentHistoryIndex < canvasHistory.length - 1) {
            canvasHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
        }
        
        // 새 상태 저장
        const json = JSON.stringify(canvas.toJSON());
        canvasHistory.push(json);
        currentHistoryIndex = canvasHistory.length - 1;
        
        // 최대 이력 단계 유지
        if (canvasHistory.length > maxHistorySteps) {
            canvasHistory.shift();
            currentHistoryIndex--;
        }
    } catch (error) {
        console.error('캔버스 상태 저장 오류:', error);
    }
}

// 실행 취소 함수
function undo() {
    if (!canvas || canvasHistory.length === 0) {
        console.error('캔버스가 초기화되지 않았거나 이력이 없습니다.');
        return;
    }

    try {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            loadCanvasState(canvasHistory[currentHistoryIndex]);
        }
    } catch (error) {
        console.error('실행 취소 오류:', error);
    }
}

// 다시 실행 함수
function redo() {
    if (!canvas || canvasHistory.length === 0) {
        console.error('캔버스가 초기화되지 않았거나 이력이 없습니다.');
        return;
    }

    try {
        if (currentHistoryIndex < canvasHistory.length - 1) {
            currentHistoryIndex++;
            loadCanvasState(canvasHistory[currentHistoryIndex]);
        }
    } catch (error) {
        console.error('다시 실행 오류:', error);
    }
}

// 캔버스 상태 로드 함수
function loadCanvasState(json) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        console.log('Loading canvas state:', json);
        canvas.loadFromJSON(JSON.parse(json), function() {
            canvas.renderAll();
            updatePropertiesPanel(canvas.getActiveObject());
        });
    } catch (error) {
        console.error('Canvas state loading error:', error);
        // 오류 발생 시 기본 캔버스 생성
        try {
            initCanvasWithDefaults();
        } catch (initError) {
            console.error('캔버스 초기화 오류:', initError);
        }
    }
}

// 맨 앞으로 가져오기 함수
function bringToFront() {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        const activeObject = canvas.getActiveObject();
        
        if (activeObject) {
            canvas.bringToFront(activeObject);
            canvas.renderAll();
        }
    } catch (error) {
        console.error('객체 맨 앞으로 가져오기 오류:', error);
    }
}

// 맨 뒤로 보내기 함수
function sendToBack() {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    try {
        const activeObject = canvas.getActiveObject();
        
        if (activeObject) {
            canvas.sendToBack(activeObject);
            canvas.renderAll();
        }
    } catch (error) {
        console.error('객체 맨 뒤로 보내기 오류:', error);
    }
}

// 속성 패널 업데이트 함수
function updatePropertiesPanel(object) {
    try {
        hideAllPropertySections();
        
        if (!object) {
            showPropertySection('general-properties');
            return;
        }
        
        if (object.type === 'i-text' || object.type === 'textbox') {
            showPropertySection('text-properties');
            updateTextProperties(object);
        } else if (object.type === 'image') {
            showPropertySection('image-properties');
            updateImageProperties(object);
        } else if (object.type === 'rect' || object.type === 'circle' || object.type === 'triangle') {
            showPropertySection('shape-properties');
            updateShapeProperties(object);
        } else if (object.menuElement === 'table') {
            showPropertySection('menu-table-properties');
            updateTableProperties(object);
        } else if (object.type === 'group') {
            // 그룹 객체일 경우 메뉴 테이블인지 확인
            if (object.menuElement === 'table') {
                showPropertySection('menu-table-properties');
                updateTableProperties(object);
            } else {
                showPropertySection('general-properties');
            }
        } else {
            showPropertySection('general-properties');
        }
    } catch (error) {
        console.error('속성 패널 업데이트 오류:', error);
        // 오류 발생 시 기본 패널 표시
        try {
            showPropertySection('general-properties');
        } catch (showError) {
            console.error('기본 속성 패널 표시 오류:', showError);
        }
    }
}

// 속성 섹션 표시/숨김 함수
function hideAllPropertySections() {
    try {
        const sections = document.querySelectorAll('.property-section');
        if (sections && sections.length > 0) {
            sections.forEach(function(section) {
                section.classList.add('d-none');
            });
        }
    } catch (error) {
        console.error('속성 섹션 숨김 오류:', error);
    }
}

function showPropertySection(sectionId) {
    try {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('d-none');
        } else {
            console.warn(`속성 섹션을 찾을 수 없음: ${sectionId}`);
        }
    } catch (error) {
        console.error('속성 섹션 표시 오류:', error);
    }
}

// 디자인 저장 함수
function saveDesign() {
    const designName = document.getElementById('design-name').value;
    
    if (!designName) {
        alert('디자인 이름을 입력해주세요.');
        return;
    }
    
    // 캔버스 데이터 준비
    const canvasData = canvas.toJSON();
    const dataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.8
    });
    
    // 디자인 데이터 객체 생성
    const designData = {
        name: designName,
        background_image: dataUrl,
        canvas_data: JSON.stringify(canvasData),
        text_content: '',
        price_info: '',
        video_url: ''
    };
    
    // AJAX 요청으로 디자인 저장
    const designId = window.designId; // 편집 모드인 경우 있음
    const url = designId ? 
        `/designs/${designId}/edit` : 
        `/designs/create`;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(designData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(designId ? '디자인이 업데이트되었습니다.' : '새 디자인이 생성되었습니다.');
            window.location.href = '/designs';
        } else {
            alert('저장 실패: ' + result.message);
        }
    })
    .catch(error => {
        console.error('저장 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
    });
}

// CSRF 토큰 가져오기
function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
}

// 외부 파일에서 접근할 함수들
window.loadCanvasData = function(canvasData) {
    if (!canvas) {
        console.error('캔버스가 초기화되지 않았습니다.');
        return;
    }

    console.log('Loading canvas data:', canvasData);
    try {
        canvas.loadFromJSON(canvasData, function() {
            canvas.renderAll();
            // 캔버스 속성 업데이트
            const bgColorInput = document.getElementById('canvas-background');
            const widthInput = document.getElementById('canvas-width');
            const heightInput = document.getElementById('canvas-height');
            
            if (canvasData.backgroundImage && bgColorInput) {
                bgColorInput.value = canvasData.backgroundColor || '#ffffff';
            }
            
            if (canvasData.width && widthInput) {
                widthInput.value = canvasData.width;
            }
            
            if (canvasData.height && heightInput) {
                heightInput.value = canvasData.height;
            }
            
            console.log('Canvas data loaded successfully');
        });
    } catch (error) {
        console.error('Failed to load canvas data:', error);
        // 오류 발생 시 기본 캔버스 생성
        initCanvasWithDefaults();
    }
}

window.initCanvasWithDefaults = initCanvasWithDefaults;
window.setBackgroundImage = setBackgroundImage;

// 메뉴 테이블 추가 함수 (구현하지 않았던 함수 추가)
function addMenuTable() {
    // 메뉴 테이블 요소 생성
    const tableWidth = 600;
    const tableHeight = 400;
    
    // 테이블 배경
    const tableBackground = new fabric.Rect({
        width: tableWidth,
        height: tableHeight,
        fill: '#ffffff',
        stroke: '#dddddd',
        strokeWidth: 1
    });
    
    // 테이블 헤더
    const headerHeight = 50;
    const tableHeader = new fabric.Rect({
        width: tableWidth,
        height: headerHeight,
        fill: '#4CAF50',
        stroke: '#388E3C',
        strokeWidth: 1,
        top: 0
    });
    
    // 헤더 텍스트
    const headerText = new fabric.Text('메뉴 카테고리', {
        fontSize: 20,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#ffffff',
        top: headerHeight / 2 - 10,
        left: tableWidth / 2,
        originX: 'center',
        originY: 'center'
    });
    
    // 테이블 그룹 생성
    const tableGroup = new fabric.Group([tableBackground, tableHeader, headerText], {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        menuElement: 'table' // 메뉴 테이블 속성 추가
    });
    
    canvas.add(tableGroup);
    canvas.setActiveObject(tableGroup);
    canvas.renderAll();
    saveCanvasState();
    
    return tableGroup;
}

// 텍스트 속성 업데이트 함수
function updateTextProperties(textObject) {
    const textContent = document.getElementById('text-content');
    const fontFamily = document.getElementById('text-font-family');
    const fontSize = document.getElementById('text-font-size');
    const textColor = document.getElementById('text-color');
    const textBold = document.getElementById('text-bold');
    const textItalic = document.getElementById('text-italic');
    const textAlign = document.getElementById('text-align');
    
    if (textContent) textContent.value = textObject.text;
    if (fontFamily) fontFamily.value = textObject.fontFamily;
    if (fontSize) fontSize.value = textObject.fontSize;
    if (textColor) textColor.value = textObject.fill;
    if (textBold) textBold.checked = textObject.fontWeight === 'bold';
    if (textItalic) textItalic.checked = textObject.fontStyle === 'italic';
    if (textAlign) textAlign.value = textObject.textAlign || 'left';
}

// 이미지 속성 업데이트 함수
function updateImageProperties(imageObject) {
    const imageOpacity = document.getElementById('image-opacity');
    const imageLock = document.getElementById('image-lock');
    
    if (imageOpacity) imageOpacity.value = imageObject.opacity || 1;
    if (imageLock) imageLock.checked = imageObject.lockMovementX && imageObject.lockMovementY;
}

// 도형 속성 업데이트 함수
function updateShapeProperties(shapeObject) {
    const shapeFill = document.getElementById('shape-fill');
    const shapeStroke = document.getElementById('shape-stroke');
    const shapeStrokeWidth = document.getElementById('shape-stroke-width');
    const shapeOpacity = document.getElementById('shape-opacity');
    
    if (shapeFill) shapeFill.value = shapeObject.fill;
    if (shapeStroke) shapeStroke.value = shapeObject.stroke || '#000000';
    if (shapeStrokeWidth) shapeStrokeWidth.value = shapeObject.strokeWidth || 0;
    if (shapeOpacity) shapeOpacity.value = shapeObject.opacity || 1;
}

// 메뉴 테이블 속성 업데이트 함수
function updateTableProperties(tableObject) {
    const tableCategory = document.getElementById('table-category');
    const tableColumns = document.getElementById('table-columns');
    const tableWidth = document.getElementById('table-width');
    const tableShowPrice = document.getElementById('table-show-price');
    const tableShowImage = document.getElementById('table-show-image');
    const tableShowDesc = document.getElementById('table-show-desc');
    const tableHeaderColor = document.getElementById('table-header-color');
    const tableTextColor = document.getElementById('table-text-color');
    
    // 테이블 객체에서 속성 가져오기 (없으면 기본값 사용)
    const tableData = tableObject.data || {};
    
    if (tableCategory) tableCategory.value = tableData.categoryId || '';
    if (tableColumns) tableColumns.value = tableData.columns || 2;
    if (tableWidth) tableWidth.value = Math.round(tableObject.width) || 600;
    if (tableShowPrice) tableShowPrice.checked = tableData.showPrice !== false;
    if (tableShowImage) tableShowImage.checked = tableData.showImage !== false;
    if (tableShowDesc) tableShowDesc.checked = tableData.showDesc !== false;
    
    // 헤더 색상 추출
    if (tableHeaderColor && tableObject._objects) {
        const header = tableObject._objects.find(obj => obj.fill && obj.fill !== '#ffffff');
        if (header) {
            tableHeaderColor.value = header.fill;
        }
    }
    
    // 텍스트 색상 추출
    if (tableTextColor && tableObject._objects) {
        const text = tableObject._objects.find(obj => obj.type === 'text');
        if (text) {
            tableTextColor.value = text.fill;
        }
    }
    
    // 테이블 업데이트 버튼 이벤트
    const applyTableChanges = document.getElementById('apply-table-changes');
    if (applyTableChanges) {
        // 기존 이벤트 리스너 제거
        const newApplyTableChanges = applyTableChanges.cloneNode(true);
        applyTableChanges.parentNode.replaceChild(newApplyTableChanges, applyTableChanges);
        
        // 새 이벤트 리스너 등록
        newApplyTableChanges.addEventListener('click', function() {
            updateTableFromProperties(tableObject);
        });
    }
}

// 메뉴 테이블 업데이트 함수
function updateTableFromProperties(tableObject) {
    const categoryId = document.getElementById('table-category').value;
    const columns = parseInt(document.getElementById('table-columns').value);
    const tableWidth = parseInt(document.getElementById('table-width').value);
    const showPrice = document.getElementById('table-show-price').checked;
    const showImage = document.getElementById('table-show-image').checked;
    const showDesc = document.getElementById('table-show-desc').checked;
    const headerColor = document.getElementById('table-header-color').value;
    const textColor = document.getElementById('table-text-color').value;
    
    // 테이블 객체 데이터 업데이트
    tableObject.data = {
        categoryId,
        columns,
        showPrice,
        showImage,
        showDesc
    };
    
    // 테이블 크기 조정
    const scaleX = tableWidth / tableObject.width;
    tableObject.scale(scaleX);
    
    // 헤더 색상 업데이트
    if (tableObject._objects) {
        const header = tableObject._objects.find(obj => obj.fill && obj.fill !== '#ffffff');
        if (header) {
            header.set('fill', headerColor);
        }
        
        // 텍스트 색상 업데이트
        const texts = tableObject._objects.filter(obj => obj.type === 'text');
        texts.forEach(text => {
            text.set('fill', textColor);
        });
    }
    
    canvas.renderAll();
    saveCanvasState();
} 