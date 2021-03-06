import { Component, AfterViewInit, EventEmitter, Output, Input, OnInit, HostListener } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngx-float-ball',
  template: `
  <div id="floating-ball-container"
       class="{{rippleClassName}} {{blinkingAnimationClassName}}"
       (click)="clicked.emit();"
       [style.cursor]="currentCursorStyle"
       [style.background]="background"
       [style.width]="addUnit(outerCircleDiameter)"
       [style.height]="addUnit(outerCircleDiameter)">
      <div id="inner-circle"
        [style.width]="addUnit(innerCircleDiameter)"
        [style.height]="addUnit(innerCircleDiameter)"
        [style.background]="foreground"
        [style.top]="addUnit(outerCircleDiameter / 2 - innerCircleDiameter / 2)"
        [style.left]="addUnit(outerCircleDiameter / 2 - innerCircleDiameter / 2)">
        <img *ngIf="!(icon === '')" src="{{icon}}" [style.width]="addUnit(iconDiameter)" [style.height]="addUnit(iconDiameter)">
      </div>
</div>
  `,
  styleUrls: ['./ngx-float-ball.scss', './ripple.scss']
})
export class NgxFloatBallComponent implements AfterViewInit, OnInit {

  // 点击悬浮球信号
  @Output() public clicked = new EventEmitter();
  @Input() outerCircleDiameter = 60;    // 外圆直径
  @Input() innerCircleDiameter = 30;    // 内圆直径
  @Input() delayTime = 400;             // 鼠标移动延迟时间，即按压400ms后生效
  @Input() isBlinked = true;            // 是否闪烁
  @Input() hasRipple = true;            // 是否有点击波纹效果
  @Input() foreground = '#ffffff';      // 前景色,默认为白色
  @Input() background = '#F44336';      // 背景色，默认为红色
  @Input() icon = '';                   // 图标路径
  @Input() iconDiameter = 30;           // 图标的直径

  posX = 0;            // 悬浮球的x轴位置
  posY = 0;            // 悬浮球的y轴位置

  isPressed = false;   // 鼠标是否按下的标记
  lastMousePos = {     // 记录鼠标按下时的坐标
    x: 0,
    y: 0
  };
  mouseOffsetX = 0;    // 鼠标X偏移量
  mouseOffsetY = 0;    // 鼠标X偏移量
  elementOffsetX = 0;  // 悬浮球容器的X偏移量
  elementOffsetY = 0;  // 悬浮球容器的Y偏移量

  touchOffset = 10;    // 触摸移动误差10px

  currentCursorStyle = 'default';
  rippleClassName = 'ripple';
  blinkingAnimationClassName = 'blinking';
  private viewWidth: number;
  private viewHeight: number;
  private rootNode: HTMLElement;
  private timer: any;
  private cursorStyle = { default: 'default', moved: 'move' };

  constructor() {

  }

  ngOnInit() {
    if (!this.hasRipple) {
      this.rippleClassName = '';
    }

    if (!this.isBlinked) {
      this.blinkingAnimationClassName = '';
    }
  }

  ngAfterViewInit() {


    this.rootNode = document.getElementById('floating-ball-container');
    this.viewWidth = window.innerWidth;
    this.viewHeight = window.innerHeight;

    // >>>-------------------------------------------------------------------------------------------
    // 鼠标移动
    this.rootNode.oncontextmenu = (event) => {  // 取消元素的浏览器右键
      if (document.all) {
        window.event.returnValue = false; // for IE
      } else {
        event.preventDefault();
      }
    };
    this.rootNode.addEventListener('mousedown', (event) => {
      if (event.button !== 0) {
        return;
      }
      this.timer = setInterval(() => {
        this.isPressed = true; // 确认鼠标按下
        this.openMoveCursor();
      }, this.delayTime);
      this.lastMousePos.x = event.clientX; // 记录鼠标当前的x坐标
      this.lastMousePos.y = event.clientY; // 记录鼠标当前的y坐标
      this.elementOffsetX = this.rootNode.offsetLeft; // 记录容器元素当时的左偏移量
      this.elementOffsetY = this.rootNode.offsetTop; // 记录容器元素的上偏移量
      event.preventDefault();                   // 取消其他事件
    }, false);

    // 此处必须挂载在document上，否则会发生鼠标移动过快停止
    document.addEventListener('mousemove', (event) => {
      if (this.isPressed) {// 如果是鼠标按下则继续执行
        this.mouseOffsetX = event.clientX - this.lastMousePos.x; // 记录在鼠标x轴移动的数据
        this.mouseOffsetY = event.clientY - this.lastMousePos.y; // 记录在鼠标y轴移动的数据
        this.posX = this.elementOffsetX + this.mouseOffsetX; // 容器在x轴的偏移量加上鼠标在x轴移动的距离
        this.posY = this.elementOffsetY + this.mouseOffsetY; // 容器在y轴的偏移量加上鼠标在y轴移动的距离
        this.checkBorder();
        this.rootNode.style.left = this.posX + 'px';
        this.rootNode.style.top = this.posY + 'px';
      }
    }, false);

    // 鼠标释放时候的函数
    document.addEventListener('mouseup', () => {
      this.isPressed = false;
      this.closeMoveCursor();
      clearInterval(this.timer);  // 释放定时器
    }, false);
    // <<<-------------------------------------------------------------------------------------------

    // >>>-------------------------------------------------------------------------------------------
    // 触摸移动
    this.rootNode.addEventListener('touchmove', (event) => {
      event.preventDefault(); // 阻止其他事件
      if (event.targetTouches.length === 1) {
        const touch = event.targetTouches[0]; // 把元素放在手指所在的位置
        this.posX = touch.pageX - this.touchOffset; // 存储x坐标
        this.posY = touch.pageY - this.touchOffset; // 存储Y坐标
        this.checkBorder();
        this.rootNode.style.left = this.posX + 'px';
        this.rootNode.style.top = this.posY + 'px';
      }
    });
    // <<<-------------------------------------------------------------------------------------------
  }

  /**
  * @method onWindowResize 监听窗口大小变化，修改悬浮球的可移动窗口大小
  * @param grid {Ext.Grid.Panel} 需要合并的Grid
  * @return void
  * @author vincent 2018-09-05
  * @version 0.0.1
  * @example
  * @log 1. vincent,2018-09-05,完成
  */
  @HostListener('window:resize')
  onWindowResize(): void {
    this.viewHeight = window.innerHeight;
    this.viewWidth = window.innerWidth;

    this.checkBorder();

    this.rootNode.style.left = this.posX + 'px';
    this.rootNode.style.top = this.posY + 'px';
  }
  /**
  * @method changeCursorStyle 动态修改鼠标指针的样式
  * @return void
  * @author vincent 2018-09-02
  * @version 0.0.1
  * @example
  * @log 1. vincent,2018-09-02,完成
  */
  openMoveCursor(): void {
    if (this.currentCursorStyle === this.cursorStyle.moved) {
      return;
    }
    this.currentCursorStyle = this.cursorStyle.moved;
  }

  /**
  * @method closeMoveCursor 关闭鼠标移动样式
  * @return void
  * @author vincent 2018-09-05
  * @version 0.0.1
  * @example
  * @log 1. vincent,2018-09-05,完成
  */
  closeMoveCursor(): void {
    if (this.currentCursorStyle === this.cursorStyle.default) {
      return;
    }
    this.currentCursorStyle = this.cursorStyle.default;
  }

  /**
  * @method addUnit 将数字添加单位px
  * @param value {number} 需要合并列的Index(序号)数组；从0开始计数，序号也包含。
  * @return string 返回带单位的字符串 例如：95px
  * @author vincent 2018-09-05
  * @version 0.0.1
  * @example
  * @log 1. vincent,2018-09-05,完成
  */
  addUnit(value: number): string {
    return value + 'px';
  }

  checkBorder(): void {
    // 右边界
    if (this.posX + this.outerCircleDiameter > this.viewWidth) {
      this.posX = this.viewWidth - this.outerCircleDiameter;
    }

    // 左边界
    if (this.posX < 0) {
      this.posX = 0;
    }

    // 下边界
    if (this.posY + this.outerCircleDiameter > this.viewHeight) {
      this.posY = this.viewHeight - this.outerCircleDiameter;
    }

    // 上边界
    if (this.posY < 0) {
      this.posY = 0;
    }
  }
}
