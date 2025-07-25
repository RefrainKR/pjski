// js/utils/DraggableScroller.js

export class DraggableScroller {
    /**
     * @param {HTMLElement} element - 드래그 스크롤을 적용할 요소
     */
    constructor(element) {
        if (!element) return;
        this.slider = element;
        this.isDown = false;
        this.startX = 0;
        this.scrollLeft = 0;

        this.bindEvents();
    }

    bindEvents() {
        // Mouse Events
        this.slider.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.slider.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.slider.addEventListener('mouseup', () => this.handleMouseUp());
        this.slider.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Touch Events
        this.slider.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.slider.addEventListener('touchend', () => this.handleTouchEnd());
        this.slider.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }

    // --- Mouse Event Handlers ---
    handleMouseDown(e) {
        this.isDown = true;
        this.slider.classList.add('active-drag');
        this.startX = e.pageX - this.slider.offsetLeft;
        this.scrollLeft = this.slider.scrollLeft;
    }

    handleMouseLeave() {
        this.isDown = false;
        this.slider.classList.remove('active-drag');
    }

    handleMouseUp() {
        this.isDown = false;
        this.slider.classList.remove('active-drag');
    }

    handleMouseMove(e) {
        if (!this.isDown) return;
        e.preventDefault();
        const x = e.pageX - this.slider.offsetLeft;
        const walk = (x - this.startX) * 2; // 스크롤 속도 조절 (2배)
        this.slider.scrollLeft = this.scrollLeft - walk;
    }

    // --- Touch Event Handlers ---
    handleTouchStart(e) {
        // 터치가 여러 개일 경우 첫 번째 터치만 사용
        const touch = e.touches[0];
        this.isDown = true;
        this.startX = touch.pageX - this.slider.offsetLeft;
        this.scrollLeft = this.slider.scrollLeft;
    }

    handleTouchEnd() {
        this.isDown = false;
    }

    handleTouchMove(e) {
        if (!this.isDown) return;
        // e.preventDefault(); // 주석 처리: 세로 스크롤을 막지 않도록 함
        const touch = e.touches[0];
        const x = touch.pageX - this.slider.offsetLeft;
        const walk = (x - this.startX) * 2;
        this.slider.scrollLeft = this.scrollLeft - walk;
    }
}