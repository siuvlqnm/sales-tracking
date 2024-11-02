class Snowflake {
  private static instance: Snowflake;
  
  private sequence: number = 0;
  private lastTimestamp: number = -1;
  
  // 开始时间戳 (2024-01-01)
  private readonly twepoch: number = 1704067200000;
  
  // 机器ID所占位数
  private readonly workerIdBits: number = 5;
  // 数据中心ID所占位数
  private readonly datacenterIdBits: number = 5;
  // 序列号所占位数
  private readonly sequenceBits: number = 12;
  
  // 机器ID最大值
  private readonly maxWorkerId: number = -1 ^ (-1 << this.workerIdBits);
  // 数据中心ID最大值
  private readonly maxDatacenterId: number = -1 ^ (-1 << this.datacenterIdBits);
  
  // 机器ID向左移12位
  private readonly workerIdShift: number = this.sequenceBits;
  // 数据中心ID向左移17位
  private readonly datacenterIdShift: number = this.sequenceBits + this.workerIdBits;
  // 时间戳向左移22位
  private readonly timestampLeftShift: number = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;
  
  // 序列号掩码
  private readonly sequenceMask: number = -1 ^ (-1 << this.sequenceBits);
  
  // 工作机器ID
  private readonly workerId: number;
  // 数据中心ID
  private readonly datacenterId: number;
  
  private constructor(workerId: number = 1, datacenterId: number = 1) {
    // 检查参数是否合法
    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`workerId can't be greater than ${this.maxWorkerId} or less than 0`);
    }
    if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
      throw new Error(`datacenterId can't be greater than ${this.maxDatacenterId} or less than 0`);
    }
    
    this.workerId = workerId;
    this.datacenterId = datacenterId;
  }
  
  public static getInstance(): Snowflake {
    if (!Snowflake.instance) {
      Snowflake.instance = new Snowflake();
    }
    return Snowflake.instance;
  }
  
  private tilNextMillis(lastTimestamp: number): number {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }
  
  private timeGen(): number {
    return Date.now();
  }
  
  public nextId(): string {
    let timestamp = this.timeGen();
    
    // 如果当前时间小于上一次ID生成的时间戳，说明系统时钟回退过
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate id');
    }
    
    // 如果是同一时间生成的，则进行毫秒内序列
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;
      // 毫秒内序列溢出
      if (this.sequence === 0) {
        // 阻塞到下一个毫秒，获得新的时间戳
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      // 时间戳改变，毫秒内序列重置
      this.sequence = 0;
    }
    
    // 上次生成ID的时间戳
    this.lastTimestamp = timestamp;
    
    // 移位并通过或运算拼到一起组成64位的ID
    const id = ((timestamp - this.twepoch) << this.timestampLeftShift) |
               (this.datacenterId << this.datacenterIdShift) |
               (this.workerId << this.workerIdShift) |
               this.sequence;
    
    return id.toString();
  }
}

// 导出生成ID的函数
export function generateId(): string {
  return Snowflake.getInstance().nextId();
}