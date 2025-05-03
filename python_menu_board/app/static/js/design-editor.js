// 전역 변수 선언
let canvas;
let canvasHistory = [];
let currentHistoryIndex = -1;
const maxHistorySteps = 30;
let activeToolType = null; // 현재 활성화된 도구 타입

// 디버그 - MenuTable 로딩 확인
console.log('디버그: MenuTable 모듈 확인 중...');

window.addEventListener('load', function() {
    console.log('디버그: 페이지 로드 완료');
});

// 캔버스 초기화
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 페이지 로드 시 단 한 번만 캔버스 초기화
        if (!canvas) {
            initCanvasWithDefaults();
        }
        
        // 전역으로 canvas 노출
        window.canvas = canvas;
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
        // 기본적으로 모든 속성 패널 숨김 처리
        hideAllPropertySections();
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
            // 모달 표시
            try {
                const designNameInput = document.getElementById('design-name-input');
                if (designNameInput) {
                    designNameInput.value = designNameInput.value || '새 디자인';
                }
                const saveModal = new bootstrap.Modal(document.getElementById('save-design-modal'));
                saveModal.show();
            } catch (error) {
                console.error('모달 표시 오류:', error);
                // 모달 오류 시 직접 저장
                saveDesign();
            }
        });
    }
    
    // 모달에서 저장 확인 버튼
    const confirmSaveBtn = document.getElementById('confirm-save-design');
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', function() {
            saveDesign();
            // 모달 닫기
            try {
                const saveModal = bootstrap.Modal.getInstance(document.getElementById('save-design-modal'));
                if (saveModal) saveModal.hide();
            } catch (error) {
                console.error('모달 닫기 오류:', error);
            }
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
    setupTextPropertyListeners();
    
    // 캔버스 객체 선택 이벤트
    if (canvas) {
        // 텍스트 더블클릭 시 편집 모드 진입
        canvas.on('mouse:dblclick', function(options) {
            if (options.target && (options.target.type === 'i-text' || options.target.type === 'text' || options.target.type === 'textbox')) {
                console.log('텍스트 더블클릭: 편집 모드 진입');
                canvas.setActiveObject(options.target);
                options.target.enterEditing();
                canvas.renderAll();
            }
        });
        
        canvas.on('selection:created', function(options) {
            const selectedObject = options.selected ? options.selected[0] : options.target;
            console.log('선택된 객체:', selectedObject);
            activeToolType = null; // 선택 시 활성 도구 초기화
            updatePropertiesPanel(selectedObject);
        });
        
        canvas.on('selection:updated', function(options) {
            const selectedObject = options.selected ? options.selected[0] : options.target;
            console.log('업데이트된 선택 객체:', selectedObject);
            activeToolType = null; // 선택 시 활성 도구 초기화
            updatePropertiesPanel(selectedObject);
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

        // 텍스트 편집 완료 후 상태 저장
        canvas.on('text:changed', function(e) {
            console.log('텍스트 변경됨:', e.target.text);
            saveCanvasState();
        });
    }
}

// 텍스트 속성 리스너 설정
function setupTextPropertyListeners() {
    // 텍스트 내용 변경
    const textContent = document.getElementById('text-content');
    if (textContent) {
        textContent.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('text', this.value);
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 글꼴 변경
    const fontFamily = document.getElementById('text-font-family');
    if (fontFamily) {
        fontFamily.addEventListener('change', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('fontFamily', this.value);
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 글자 크기 변경
    const fontSize = document.getElementById('text-font-size');
    if (fontSize) {
        fontSize.addEventListener('change', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('fontSize', parseInt(this.value));
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 글자 색상 변경
    const textColor = document.getElementById('text-color');
    if (textColor) {
        textColor.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('fill', this.value);
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 굵게 설정
    const textBold = document.getElementById('text-bold');
    if (textBold) {
        textBold.addEventListener('change', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('fontWeight', this.checked ? 'bold' : 'normal');
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 기울임 설정
    const textItalic = document.getElementById('text-italic');
    if (textItalic) {
        textItalic.addEventListener('change', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('fontStyle', this.checked ? 'italic' : 'normal');
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 텍스트 정렬 설정
    const textAlign = document.getElementById('text-align');
    if (textAlign) {
        textAlign.addEventListener('change', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('textAlign', this.value);
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 투명도 설정
    const textOpacity = document.getElementById('text-opacity');
    if (textOpacity) {
        textOpacity.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('opacity', parseFloat(this.value));
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 회전 각도 설정
    const textAngle = document.getElementById('text-angle');
    const textAngleValue = document.getElementById('text-angle-value');
    if (textAngle) {
        textAngle.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                activeObject.set('angle', parseInt(this.value));
                if(textAngleValue) textAngleValue.textContent = this.value + '°';
                canvas.renderAll();
                saveCanvasState();
            }
        });
    }
    
    // 텍스트 정렬 버튼 (있는 경우)
    setupTextAlignButtons();
}

// 텍스트 정렬 버튼 설정
function setupTextAlignButtons() {
    const textAlignLeft = document.getElementById('text-align-left');
    const textAlignCenter = document.getElementById('text-align-center');
    const textAlignRight = document.getElementById('text-align-right');
    
    if (textAlignLeft) {
        textAlignLeft.addEventListener('click', function() {
            setTextAlignment('left');
        });
    }
    
    if (textAlignCenter) {
        textAlignCenter.addEventListener('click', function() {
            setTextAlignment('center');
        });
    }
    
    if (textAlignRight) {
        textAlignRight.addEventListener('click', function() {
            setTextAlignment('right');
        });
    }
}

// 텍스트 정렬 설정 함수
function setTextAlignment(alignment) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
        activeObject.set('textAlign', alignment);
        
        // 정렬 버튼 활성화 상태 업데이트
        updateTextAlignButtons(alignment);
        
        canvas.renderAll();
        saveCanvasState();
    }
}

// 텍스트 정렬 버튼 활성화 상태 업데이트
function updateTextAlignButtons(alignment) {
    const textAlignLeft = document.getElementById('text-align-left');
    const textAlignCenter = document.getElementById('text-align-center');
    const textAlignRight = document.getElementById('text-align-right');
    
    if (textAlignLeft) textAlignLeft.classList.toggle('active', alignment === 'left');
    if (textAlignCenter) textAlignCenter.classList.toggle('active', alignment === 'center');
    if (textAlignRight) textAlignRight.classList.toggle('active', alignment === 'right');
}

// 텍스트 속성 업데이트 함수 개선
function updateTextProperties(textObject) {
    if (!textObject) return;
    
    const textContent = document.getElementById('text-content');
    const fontFamily = document.getElementById('text-font-family');
    const fontSize = document.getElementById('text-font-size');
    const textColor = document.getElementById('text-color');
    const textBold = document.getElementById('text-bold');
    const textItalic = document.getElementById('text-italic');
    const textAlign = document.getElementById('text-align');
    const textOpacity = document.getElementById('text-opacity');
    const textAngle = document.getElementById('text-angle');
    const textAngleValue = document.getElementById('text-angle-value');
    
    // 텍스트 내용 업데이트
    if (textContent) textContent.value = textObject.text || '';
    
    // 글꼴 업데이트
    if (fontFamily) {
        if (fontFamily.querySelector(`option[value="${textObject.fontFamily}"]`)) {
            fontFamily.value = textObject.fontFamily;
        } else {
            // 기본 글꼴 선택
            fontFamily.value = fontFamily.options[0].value;
        }
    }
    
    // 글자 크기 업데이트
    if (fontSize) fontSize.value = textObject.fontSize || 20;
    
    // 글자 색상 업데이트
    if (textColor) textColor.value = textObject.fill || '#000000';
    
    // 굵게 설정 업데이트
    if (textBold) textBold.checked = textObject.fontWeight === 'bold';
    
    // 기울임 설정 업데이트
    if (textItalic) textItalic.checked = textObject.fontStyle === 'italic';
    
    // 텍스트 정렬 업데이트
    if (textAlign) textAlign.value = textObject.textAlign || 'left';
    
    // 투명도 업데이트
    if (textOpacity) textOpacity.value = textObject.opacity !== undefined ? textObject.opacity : 1;
    
    // 회전 각도 업데이트
    if (textAngle) {
        const angle = Math.round(textObject.angle || 0) % 360;
        textAngle.value = angle;
        if (textAngleValue) textAngleValue.textContent = angle + '°';
    }
    
    // 텍스트 정렬 버튼 업데이트
    updateTextAlignButtons(textObject.textAlign || 'left');
    
    console.log('텍스트 속성 업데이트 완료:', textObject);
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
            textAlign: 'center',
            opacity: 1,
            angle: 0
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

        console.log('속성 패널 업데이트, 객체 타입:', object.type, '테이블 요소:', object.tableElement);
        
        // 테이블 요소 먼저 체크
        if (object.tableElement) {
            console.log('테이블 요소 속성 패널 표시');
            showPropertySection('menu-table-properties');
            updateTableProperties(object);
            activeToolType = 'menu-table';
            return;
        }
        
        // 객체 타입에 따라 적절한 속성 패널 표시
        if (object.type === 'i-text' || object.type === 'text' || object.type === 'textbox') {
            // 텍스트 객체
            console.log('텍스트 객체 속성 패널 표시');
            showPropertySection('text-properties');
            updateTextProperties(object);
            activeToolType = 'text';
        } else if (object.type === 'image') {
            // 이미지 객체
            console.log('이미지 객체 속성 패널 표시');
            showPropertySection('image-properties');
            updateImageProperties(object);
            activeToolType = 'image';
        } else if (object.type === 'rect' || object.type === 'circle' || object.type === 'triangle') {
            // 도형 객체
            console.log('도형 객체 속성 패널 표시');
            showPropertySection('shape-properties');
            updateShapeProperties(object);
            activeToolType = 'shape';
        } else if (object.type === 'group') {
            // 그룹 객체
            console.log('그룹 객체 확인 - 테이블 요소 체크');
            
            // 그룹 내에 테이블 요소가 포함되어 있는지 확인
            const hasTableElements = object.getObjects().some(obj => obj.tableElement);
            
            if (hasTableElements) {
                console.log('그룹(메뉴 테이블) 객체 속성 패널 표시');
                showPropertySection('menu-table-properties');
                updateTableProperties(object);
                activeToolType = 'menu-table';
            } else {
                console.log('일반 그룹 객체 속성 패널 표시');
                showPropertySection('general-properties');
            }
        } else {
            // 기타 객체
            console.log('기본 속성 패널 표시');
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
            console.log(`모든 속성 섹션 숨김 처리 완료 (${sections.length}개)`);
        } else {
            console.warn('속성 섹션을 찾을 수 없음: .property-section');
        }
    } catch (error) {
        console.error('속성 섹션 숨김 오류:', error);
    }
}

function showPropertySection(sectionId) {
    try {
        console.log(`속성 섹션 표시 시도: ${sectionId}`);
        const section = document.getElementById(sectionId);
        
        if (section) {
            // d-none 클래스 제거
            section.classList.remove('d-none');
            console.log(`속성 섹션 표시 성공: ${sectionId}`);
            
            // 섹션이 속성 패널 내에 있는지 확인
            const propertiesPanel = document.querySelector('.properties-panel');
            if (propertiesPanel && !propertiesPanel.contains(section)) {
                console.warn(`속성 섹션이 속성 패널 내부에 없음: ${sectionId}`);
                propertiesPanel.appendChild(section);
            }
        } else {
            console.warn(`속성 섹션을 찾을 수 없음: ${sectionId}`);
            
            // 메뉴 테이블 속성 패널 동적 생성 (찾을 수 없는 경우)
            if (sectionId === 'menu-table-properties') {
                console.log('메뉴 테이블 속성 섹션 동적 생성 시도');
                const menuTablePanel = createMenuTablePropertiesSection();
                if (menuTablePanel) {
                    menuTablePanel.classList.remove('d-none');
                    return;
                }
            }
            
            // 도형 속성 패널 동적 생성 (찾을 수 없는 경우)
            if (sectionId === 'shape-properties') {
                console.log('도형 속성 섹션 동적 생성 시도');
                const shapePanel = createShapePropertiesSection();
                if (shapePanel) {
                    shapePanel.classList.remove('d-none');
                    return;
                }
            }
            
            // 섹션이 없으면 일반 속성 패널을 대신 표시
            const generalSection = document.getElementById('general-properties');
            if (generalSection) {
                generalSection.classList.remove('d-none');
                console.log(`일반 속성 패널로 대체: ${sectionId} -> general-properties`);
            } else {
                console.error('일반 속성 패널도 찾을 수 없음');
            }
        }
    } catch (error) {
        console.error('속성 섹션 표시 오류:', error);
    }
}

// 디자인 저장 함수
function saveDesign() {
    // 모달에서 디자인 이름 가져오기
    const designNameInput = document.getElementById('design-name-input');
    const designName = designNameInput ? designNameInput.value : '새 디자인';
    
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
    
    // 저장 진행 중 표시
    const saveBtn = document.getElementById('save-design');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
    }
    
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
            
            // 저장 버튼 복원
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
            }
        }
    })
    .catch(error => {
        console.error('저장 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
        
        // 저장 버튼 복원
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
        }
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
        initCanvasWithDefaults();
    }

    console.log('캔버스 데이터 로드 시작:', typeof canvasData === 'string' ? canvasData.substring(0, 50) + '...' : 'Object');
    try {
        // canvasData가 문자열이면 JSON으로 파싱
        const jsonData = typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData;
        
        canvas.loadFromJSON(jsonData, function() {
            canvas.renderAll();
            console.log('캔버스 데이터 로드 완료');
            
            // 캔버스 속성 업데이트
            if (jsonData.backgroundColor) {
                const bgColorInput = document.getElementById('canvas-background');
                if (bgColorInput) bgColorInput.value = jsonData.backgroundColor;
            }
            
            if (jsonData.width) {
                const widthInput = document.getElementById('canvas-width');
                if (widthInput) widthInput.value = jsonData.width;
            }
            
            if (jsonData.height) {
                const heightInput = document.getElementById('canvas-height');
                if (heightInput) heightInput.value = jsonData.height;
            }
            
            // 아무 객체도 선택되지 않게 처리
            canvas.discardActiveObject();
            
            // 일반 속성 패널도 표시하지 않음
            hideAllPropertySections();
            activeToolType = null;
            
            // 상태 저장
            saveCanvasState();
        });
    } catch (error) {
        console.error('캔버스 데이터 로드 오류:', error);
        // 오류 발생 시 기본 캔버스 생성
        initCanvasWithDefaults();
        
        // 일반 속성 패널도 표시하지 않음
        hideAllPropertySections();
        activeToolType = null;
    }
}

window.initCanvasWithDefaults = initCanvasWithDefaults;
window.setBackgroundImage = setBackgroundImage;

// 메뉴 테이블 추가 함수
function addMenuTable() {
    try {
        console.log('다수 행 테이블 생성 시작');
        
        // 초기 행 개수와 설정
        const initialRows = 3;
        const rowHeight = 60;
        const tableWidth = 600;
        const menuColumnWidth = tableWidth * 0.6; // 60%를 메뉴명에 할당
        const priceColumnWidth = tableWidth * 0.4; // 40%를 가격에 할당
        
        // 캔버스 중앙 좌표
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 테이블 전체 높이 계산
        const tableHeight = rowHeight * initialRows;
        
        // 테이블 배경 - 전체 테이블 크기
        const tableBackground = new fabric.Rect({
            width: tableWidth,
            height: tableHeight,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            rx: 4,
            ry: 4,
            left: centerX,
            top: centerY,
            originX: 'center',
            originY: 'center',
            tableElement: 'background'
        });
        
        // 테이블 요소들을 담을 배열
        const tableElements = [tableBackground];
        
        // 테이블 행 구분선 추가
        for (let i = 1; i < initialRows; i++) {
            const rowLine = new fabric.Line(
                [
                    centerX - tableWidth/2, 
                    centerY - tableHeight/2 + rowHeight * i, 
                    centerX + tableWidth/2, 
                    centerY - tableHeight/2 + rowHeight * i
                ],
                {
                    stroke: '#000000',
                    strokeWidth: 1,
                    tableElement: 'rowLine'
                }
            );
            tableElements.push(rowLine);
        }
        
        // 메뉴와 가격 구분선 (세로선)
        const columnLine = new fabric.Line(
            [
                centerX - tableWidth/2 + menuColumnWidth, 
                centerY - tableHeight/2, 
                centerX - tableWidth/2 + menuColumnWidth, 
                centerY + tableHeight/2
            ],
            {
                stroke: '#000000',
                strokeWidth: 1,
                tableElement: 'columnLine'
            }
        );
        tableElements.push(columnLine);
        
        // 각 행에 메뉴명과 가격 텍스트 추가
        for (let i = 0; i < initialRows; i++) {
            // 행의 Y 좌표 (테이블 상단에서부터 각 행의 중앙)
            const rowY = centerY - tableHeight/2 + rowHeight * (i + 0.5);
            
            // 메뉴명 텍스트 - 왼쪽 정렬
            const menuText = new fabric.IText(i === 0 ? '메뉴명' : `메뉴 ${i}`, {
                fontSize: 24,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                fill: '#000000',
                left: centerX - tableWidth/2 + 20, // 왼쪽에서 약간 여백
                top: rowY,
                originX: 'left',
                originY: 'center',
                width: menuColumnWidth - 40, // 양쪽 여백 고려
                selectable: true,
                editable: true,
                tableElement: 'menuName'
            });
            
            // 가격 텍스트 - 오른쪽 정렬
            const priceText = new fabric.IText(i === 0 ? '가격' : `${i},000원`, {
                fontSize: 24,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                fill: '#000000',
                left: centerX + tableWidth/2 - 20, // 오른쪽에서 약간 여백
                top: rowY,
                originX: 'right',
                originY: 'center',
                width: priceColumnWidth - 40, // 양쪽 여백 고려
                selectable: true,
                editable: true,
                tableElement: 'price'
            });
            
            tableElements.push(menuText, priceText);
        }
        
        // 모든 테이블 요소를 캔버스에 추가
        tableElements.forEach(element => {
            canvas.add(element);
        });
        
        // 테이블 전체를 선택
        canvas.discardActiveObject();
        const selection = new fabric.ActiveSelection(tableElements, {
            canvas: canvas
        });
        canvas.setActiveObject(selection);
        canvas.renderAll();
        
        // 상태 저장
        saveCanvasState();
        
        // 행 추가 함수 (향후 UI에서 호출 가능)
        window.addTableRow = function() {
            console.log('메뉴 테이블 행 추가 시작 - 테이블 재구성 방식');
            
            try {
                // 테이블 요소 수집
                const tableObjects = canvas.getObjects().filter(obj => obj.tableElement);
                if (tableObjects.length === 0) {
                    console.error('테이블 요소를 찾을 수 없습니다.');
                    return;
                }
                
                // 테이블 배경 찾기
                const background = tableObjects.find(obj => obj.tableElement === 'background');
                if (!background) {
                    console.error('테이블 배경을 찾을 수 없습니다.');
                    return;
                }
                
                // 중요 - 테이블 배경 위치 및 크기 저장
                const originalPosition = {
                    left: background.left,
                    top: background.top,
                    width: background.width
                };
                
                // 행 높이 설정
                const rowHeight = 60;
                
                // 메뉴 항목과 가격 항목 찾기 (내용 저장)
                const menuItems = tableObjects.filter(obj => obj.tableElement === 'menuName')
                    .sort((a, b) => a.top - b.top)
                    .map(item => ({
                        text: item.text,
                        fontSize: item.fontSize,
                        fontFamily: item.fontFamily,
                        fill: item.fill,
                        fontWeight: item.fontWeight
                    }));
                
                const priceItems = tableObjects.filter(obj => obj.tableElement === 'price')
                    .sort((a, b) => a.top - b.top)
                    .map(item => ({
                        text: item.text,
                        fontSize: item.fontSize,
                        fontFamily: item.fontFamily,
                        fill: item.fill,
                        fontWeight: item.fontWeight
                    }));
                
                // 스타일 관련 속성 저장
                const backgroundFill = background.fill;
                const borderColor = background.stroke;
                const borderWidth = background.strokeWidth;
                const borderRadius = background.rx || 0;
                
                // 행 수 계산
                const currentRows = menuItems.length;
                const newRowsCount = currentRows + 1;
                
                // 모든 테이블 요소 삭제
                tableObjects.forEach(obj => {
                    canvas.remove(obj);
                });
                
                // 새 테이블 생성 - 중앙에 배치 (기존 위치 유지)
                const tableWidth = originalPosition.width;
                const tableHeight = rowHeight * newRowsCount;
                
                // 새 테이블 배경
                const newBackground = new fabric.Rect({
                    width: tableWidth,
                    height: tableHeight,
                    fill: backgroundFill,
                    stroke: borderColor,
                    strokeWidth: borderWidth,
                    rx: borderRadius,
                    ry: borderRadius,
                    left: originalPosition.left,
                    top: originalPosition.top,
                    originX: 'center',
                    originY: 'center',
                    tableElement: 'background'
                });
                
                // 테이블 요소들을 담을 배열
                const newTableElements = [newBackground];
                
                // 테이블 중심 좌표
                const centerX = originalPosition.left;
                const centerY = originalPosition.top;
                
                // 테이블 좌상단 좌표
                const tableTop = centerY - tableHeight/2;
                const tableLeft = centerX - tableWidth/2;
                
                // 테이블 행 구분선 추가
                for (let i = 1; i < newRowsCount; i++) {
                    const rowLine = new fabric.Line(
                        [
                            tableLeft, 
                            tableTop + rowHeight * i, 
                            tableLeft + tableWidth, 
                            tableTop + rowHeight * i
                        ],
                        {
                            stroke: borderColor,
                            strokeWidth: 1,
                            tableElement: 'rowLine'
                        }
                    );
                    newTableElements.push(rowLine);
                }
                
                // 열 비율 유지 (60:40)
                const menuColumnWidth = tableWidth * 0.6;
                
                // 메뉴와 가격 구분선 (세로선)
                const columnLine = new fabric.Line(
                    [
                        tableLeft + menuColumnWidth, 
                        tableTop, 
                        tableLeft + menuColumnWidth, 
                        tableTop + tableHeight
                    ],
                    {
                        stroke: borderColor,
                        strokeWidth: 1,
                        tableElement: 'columnLine'
                    }
                );
                newTableElements.push(columnLine);
                
                // 기존 메뉴 항목 복원 + 새 항목 추가
                for (let i = 0; i < newRowsCount; i++) {
                    // 행의 Y 좌표 (테이블 상단에서부터 각 행의 중앙)
                    const rowY = tableTop + rowHeight * (i + 0.5);
                    
                    // 메뉴 아이템 정보
                    const menuInfo = i < currentRows ? menuItems[i] : {
                        text: `메뉴 ${i+1}`,
                        fontSize: menuItems[0].fontSize || 24,
                        fontFamily: menuItems[0].fontFamily || 'Arial',
                        fill: menuItems[0].fill || '#000000',
                        fontWeight: 'bold'
                    };
                    
                    // 가격 아이템 정보
                    const priceInfo = i < currentRows ? priceItems[i] : {
                        text: `${i+1},000원`,
                        fontSize: priceItems[0].fontSize || 24,
                        fontFamily: priceItems[0].fontFamily || 'Arial',
                        fill: priceItems[0].fill || '#000000',
                        fontWeight: 'normal'
                    };
                    
                    // 메뉴명 텍스트 - 왼쪽 정렬
                    const menuText = new fabric.IText(menuInfo.text, {
                        fontSize: menuInfo.fontSize,
                        fontFamily: menuInfo.fontFamily,
                        fontWeight: menuInfo.fontWeight,
                        fill: menuInfo.fill,
                        left: tableLeft + 20, // 왼쪽에서 약간 여백
                        top: rowY,
                        originX: 'left',
                        originY: 'center',
                        width: menuColumnWidth - 40, // 양쪽 여백 고려
                        selectable: true,
                        editable: true,
                        tableElement: 'menuName'
                    });
                    
                    // 가격 텍스트 - 오른쪽 정렬
                    const priceText = new fabric.IText(priceInfo.text, {
                        fontSize: priceInfo.fontSize,
                        fontFamily: priceInfo.fontFamily,
                        fontWeight: priceInfo.fontWeight,
                        fill: priceInfo.fill,
                        left: tableLeft + tableWidth - 20, // 오른쪽에서 약간 여백
                        top: rowY,
                        originX: 'right',
                        originY: 'center',
                        width: tableWidth - menuColumnWidth - 40, // 양쪽 여백 고려
                        selectable: true,
                        editable: true,
                        tableElement: 'price'
                    });
                    
                    newTableElements.push(menuText, priceText);
                }
                
                // 모든 테이블 요소를 캔버스에 추가
                newTableElements.forEach(element => {
                    canvas.add(element);
                });
                
                // 테이블 전체를 선택
                canvas.discardActiveObject();
                const selection = new fabric.ActiveSelection(newTableElements, {
                    canvas: canvas
                });
                canvas.setActiveObject(selection);
                canvas.renderAll();
                
                // 상태 저장
                saveCanvasState();
                
                console.log('행 추가 완료 - 테이블 재구성됨, 행 수:', newRowsCount);
            } catch (error) {
                console.error('행 추가 중 오류 발생:', error);
                alert('행 추가 중 오류가 발생했습니다: ' + error.message);
            }
        };
    } catch (error) {
        console.error('메뉴 테이블 생성 오류:', error);
        alert('메뉴 테이블을 생성하는 중 오류가 발생했습니다.');
    }
}

// 메뉴 테이블 속성 패널을 동적으로 생성하는 함수 (fallback)
function createMenuTablePropertiesSection() {
    try {
        // 기존에 있는지 확인
        if (document.getElementById('menu-table-properties')) {
            return;
        }

        console.log('메뉴 테이블 속성 섹션을 동적으로 생성합니다.');
        
        // 속성 패널 컨테이너 찾기
        const propertiesPanel = document.querySelector('.properties-panel');
        if (!propertiesPanel) {
            console.error('속성 패널을 찾을 수 없습니다.');
            return;
        }
        
        // 메뉴 테이블 속성 섹션 생성
        const menuTableProperties = document.createElement('div');
        menuTableProperties.id = 'menu-table-properties';
        menuTableProperties.className = 'property-section d-none';
        
        // 속성 패널 내용 추가
        menuTableProperties.innerHTML = `
            <div class="mb-3">
                <h6 class="fw-bold">메뉴 테이블 설정</h6>
                
                <!-- 행 추가 버튼 -->
                <div class="form-group mb-3">
                    <button id="add-table-row" class="btn btn-primary w-100">
                        <i class="fas fa-plus"></i> 메뉴 행 추가
                    </button>
                </div>
                
                <hr>
                
                <!-- 텍스트 설정 -->
                <div class="form-group mb-2">
                    <label for="table-font-size">폰트 크기</label>
                    <input type="number" id="table-font-size" class="form-control" value="24" min="12" max="72">
                </div>
                
                <div class="form-group mb-2">
                    <label for="table-text-color">텍스트 색상</label>
                    <input type="color" id="table-text-color" class="form-control" value="#000000">
                </div>
                
                <hr>
                
                <!-- 테이블 스타일 -->
                <div class="form-group mb-2">
                    <label for="table-background-color">배경 색상</label>
                    <input type="color" id="table-background-color" class="form-control" value="#ffffff">
                </div>
                
                <div class="form-group mb-2">
                    <label for="table-border-color">테두리 색상</label>
                    <input type="color" id="table-border-color" class="form-control" value="#000000">
                </div>
                
                <div class="form-group mb-2">
                    <label for="table-border-width">테두리 두께</label>
                    <input type="number" id="table-border-width" class="form-control" value="2" min="0" max="10">
                </div>
                
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="table-hide-border">
                    <label class="form-check-label" for="table-hide-border">테두리 감추기</label>
                </div>
                
                <div class="form-group mb-2">
                    <label for="table-width">테이블 너비</label>
                    <input type="number" id="table-width" class="form-control" value="600" min="300" max="1500">
                </div>
                
                <button id="apply-table-changes" class="btn btn-primary w-100 mt-3">테이블 스타일 적용</button>
            </div>
        `;
        
        // 패널에 추가
        propertiesPanel.appendChild(menuTableProperties);
        
        console.log('메뉴 테이블 속성 섹션 생성 완료');
        
        // 이벤트 핸들러 연결
        setupTablePropertyEventHandlers();
        
        return menuTableProperties;
    } catch (error) {
        console.error('메뉴 테이블 속성 섹션 생성 오류:', error);
        return null;
    }
}

// 테이블 속성 이벤트 핸들러 설정
function setupTablePropertyEventHandlers() {
    try {
        // 행 추가 버튼
        const addTableRowBtn = document.getElementById('add-table-row');
        if (addTableRowBtn) {
            addTableRowBtn.addEventListener('click', function() {
                window.addTableRow();
            });
        }
        
        // 테이블 스타일 적용 버튼
        const applyTableChangesBtn = document.getElementById('apply-table-changes');
        if (applyTableChangesBtn) {
            applyTableChangesBtn.addEventListener('click', function() {
                applyTableStyleChanges();
            });
        }
    } catch (error) {
        console.error('테이블 속성 이벤트 핸들러 설정 오류:', error);
    }
}

// 테이블 스타일 변경 적용 함수
function applyTableStyleChanges() {
    try {
        console.log('테이블 스타일 변경 적용');
        
        // 속성 값 가져오기
        const fontSize = parseInt(document.getElementById('table-font-size')?.value) || 24;
        const textColor = document.getElementById('table-text-color')?.value || '#000000';
        const backgroundColor = document.getElementById('table-background-color')?.value || '#ffffff';
        const borderColor = document.getElementById('table-border-color')?.value || '#000000';
        const borderWidth = parseInt(document.getElementById('table-border-width')?.value) || 2;
        const hideBorder = document.getElementById('table-hide-border')?.checked || false;
        const tableWidth = parseInt(document.getElementById('table-width')?.value) || 600;
        
        console.log('테이블 속성 값:', {
            fontSize, textColor, backgroundColor, borderColor, 
            borderWidth, hideBorder, tableWidth
        });
        
        // 테이블 요소 찾기
        const tableElements = canvas.getObjects().filter(obj => obj.tableElement);
        
        if (tableElements.length === 0) {
            console.warn('테이블 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 테이블 배경 업데이트
        const background = tableElements.find(obj => obj.tableElement === 'background');
        if (background) {
            background.set({
                fill: backgroundColor,
                stroke: hideBorder ? 'transparent' : borderColor,
                strokeWidth: hideBorder ? 0 : borderWidth,
                width: tableWidth
            });
            
            // 테이블 너비 값 저장 (행 추가 시 사용)
            background.tableWidth = tableWidth;
        }
        
        // 행 구분선 업데이트
        const rowLines = tableElements.filter(obj => obj.tableElement === 'rowLine');
        rowLines.forEach(line => {
            line.set({
                stroke: hideBorder ? 'transparent' : borderColor,
                strokeWidth: hideBorder ? 0 : 1,
                x2: line.x1 + tableWidth
            });
        });
        
        // 열 구분선 업데이트
        const columnLine = tableElements.find(obj => obj.tableElement === 'columnLine');
        if (columnLine) {
            columnLine.set({
                stroke: hideBorder ? 'transparent' : borderColor,
                strokeWidth: hideBorder ? 0 : 1,
                x1: background.left - background.width/2 + (tableWidth * 0.6),
                x2: background.left - background.width/2 + (tableWidth * 0.6)
            });
        }
        
        // 메뉴명 텍스트 업데이트
        const menuTexts = tableElements.filter(obj => obj.tableElement === 'menuName');
        menuTexts.forEach(text => {
            text.set({
                fontSize: fontSize,
                fill: textColor
            });
        });
        
        // 가격 텍스트 업데이트
        const priceTexts = tableElements.filter(obj => obj.tableElement === 'price');
        priceTexts.forEach(text => {
            text.set({
                fontSize: fontSize,
                fill: textColor,
                left: background.left + tableWidth/2 - 20
            });
        });
        
        // 캔버스 업데이트
        canvas.renderAll();
        
        // 상태 저장
        saveCanvasState();
        
        console.log('테이블 스타일 변경 완료');
    } catch (error) {
        console.error('테이블 스타일 변경 오류:', error);
    }
}

// 메뉴 테이블 속성 업데이트 함수
function updateTableProperties(tableObject) {
    console.log('테이블 속성 업데이트 함수 호출됨', tableObject);
    
    try {
        // 메뉴 테이블 속성 패널이 없으면 생성
        const menuTablePanel = document.getElementById('menu-table-properties');
        if (!menuTablePanel) {
            console.log('메뉴 테이블 속성 패널이 없어 새로 생성합니다');
            createMenuTablePropertiesSection();
        } else {
            console.log('기존 메뉴 테이블 속성 패널 사용');
        }
        
        // 속성 패널 표시
        hideAllPropertySections();
        showPropertySection('menu-table-properties');
        
        // 테이블 요소가 하나만 선택되어 있으면 모든 테이블 요소를 찾아서 분석
        const tableElements = canvas.getObjects().filter(obj => obj.tableElement);
        console.log('찾은 테이블 요소 수:', tableElements.length);
        
        // 테이블 요소가 없으면 기본 속성만 표시
        if (tableElements.length === 0) {
            console.warn('테이블 요소를 찾을 수 없어 기본 속성만 표시합니다');
            return;
        }
        
        // 테이블 배경에서 기본 속성 가져오기
        const background = tableElements.find(obj => obj.tableElement === 'background');
        if (!background) {
            console.warn('테이블 배경 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('테이블 배경 속성:', {
            width: background.width,
            height: background.height,
            fill: background.fill,
            stroke: background.stroke,
            strokeWidth: background.strokeWidth
        });
        
        // 현재 속성 가져오기
        const hideBorder = background.stroke === 'transparent';
        
        // 텍스트 요소에서 폰트 속성 가져오기
        const menuText = tableElements.find(obj => obj.tableElement === 'menuName');
        const fontSize = menuText ? menuText.fontSize : 24;
        const textColor = menuText ? menuText.fill : '#000000';
        
        // 속성 패널 값 설정
        const fontSizeInput = document.getElementById('table-font-size');
        const textColorInput = document.getElementById('table-text-color');
        const backgroundColorInput = document.getElementById('table-background-color');
        const borderColorInput = document.getElementById('table-border-color');
        const borderWidthInput = document.getElementById('table-border-width');
        const hideBorderInput = document.getElementById('table-hide-border');
        const tableWidthInput = document.getElementById('table-width');
        
        console.log('폼 입력 필드 확인:', {
            fontSizeInput: !!fontSizeInput,
            textColorInput: !!textColorInput,
            backgroundColorInput: !!backgroundColorInput,
            borderColorInput: !!borderColorInput,
            borderWidthInput: !!borderWidthInput,
            hideBorderInput: !!hideBorderInput,
            tableWidthInput: !!tableWidthInput
        });
        
        if (fontSizeInput) fontSizeInput.value = fontSize;
        if (textColorInput) textColorInput.value = textColor;
        if (backgroundColorInput) backgroundColorInput.value = background.fill;
        if (borderColorInput) borderColorInput.value = background.stroke === 'transparent' ? '#000000' : background.stroke;
        if (borderWidthInput) borderWidthInput.value = background.strokeWidth || 2;
        if (hideBorderInput) hideBorderInput.checked = hideBorder;
        if (tableWidthInput) tableWidthInput.value = background.width || 600;
        
    } catch (error) {
        console.error('테이블 속성 업데이트 오류:', error);
    }
}

// 도형 속성 패널 동적 생성 함수
function createShapePropertiesSection() {
    try {
        // 이미 있는지 확인
        if (document.getElementById('shape-properties')) {
            return document.getElementById('shape-properties');
        }

        console.log('도형 속성 섹션을 동적으로 생성합니다.');
        
        // 속성 패널 컨테이너 찾기
        const propertiesPanel = document.querySelector('.properties-panel');
        if (!propertiesPanel) {
            console.error('속성 패널을 찾을 수 없습니다.');
            return null;
        }
        
        // 도형 속성 섹션 생성
        const shapeProperties = document.createElement('div');
        shapeProperties.id = 'shape-properties';
        shapeProperties.className = 'property-section d-none';
        
        // 속성 패널 내용 추가
        shapeProperties.innerHTML = `
            <div class="form-group mb-3">
                <label for="shape-fill">채우기 색상</label>
                <input type="color" id="shape-fill" class="form-control" value="#4CAF50">
            </div>
            <div class="form-group mb-3">
                <label for="shape-stroke">테두리 색상</label>
                <input type="color" id="shape-stroke" class="form-control" value="#000000">
            </div>
            <div class="form-group mb-3">
                <label for="shape-stroke-width">테두리 두께</label>
                <input type="number" id="shape-stroke-width" class="form-control" value="1" min="0" max="20">
            </div>
            <div class="form-group mb-3">
                <label for="shape-opacity">투명도</label>
                <input type="range" id="shape-opacity" class="form-range" min="0" max="1" step="0.1" value="1">
            </div>
        `;
        
        // 패널에 추가
        propertiesPanel.appendChild(shapeProperties);
        
        console.log('도형 속성 섹션 생성 완료');
        
        // 이벤트 핸들러 연결
        setupShapePropertyEventHandlers();
        
        return shapeProperties;
    } catch (error) {
        console.error('도형 속성 섹션 생성 오류:', error);
        return null;
    }
}

// 도형 속성 이벤트 핸들러 설정
function setupShapePropertyEventHandlers() {
    try {
        // 채우기 색상 변경
        const shapeFill = document.getElementById('shape-fill');
        if (shapeFill) {
            shapeFill.addEventListener('input', function() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle')) {
                    activeObject.set('fill', this.value);
                    canvas.renderAll();
                    saveCanvasState();
                }
            });
        }
        
        // 테두리 색상 변경
        const shapeStroke = document.getElementById('shape-stroke');
        if (shapeStroke) {
            shapeStroke.addEventListener('input', function() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle')) {
                    activeObject.set('stroke', this.value);
                    canvas.renderAll();
                    saveCanvasState();
                }
            });
        }
        
        // 테두리 두께 변경
        const shapeStrokeWidth = document.getElementById('shape-stroke-width');
        if (shapeStrokeWidth) {
            shapeStrokeWidth.addEventListener('change', function() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle')) {
                    activeObject.set('strokeWidth', parseInt(this.value));
                    canvas.renderAll();
                    saveCanvasState();
                }
            });
        }
        
        // 투명도 변경
        const shapeOpacity = document.getElementById('shape-opacity');
        if (shapeOpacity) {
            shapeOpacity.addEventListener('input', function() {
                const activeObject = canvas.getActiveObject();
                if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle')) {
                    activeObject.set('opacity', parseFloat(this.value));
                    canvas.renderAll();
                    saveCanvasState();
                }
            });
        }
    } catch (error) {
        console.error('도형 속성 이벤트 핸들러 설정 오류:', error);
    }
}

// 이미지 속성 업데이트 함수
function updateImageProperties(imageObject) {
    const imageOpacity = document.getElementById('image-opacity');
    const imageLock = document.getElementById('image-lock');
    
    if (imageOpacity) imageOpacity.value = imageObject.opacity || 1;
    if (imageLock) imageLock.checked = imageObject.lockMovementX && imageObject.lockMovementY;
} 