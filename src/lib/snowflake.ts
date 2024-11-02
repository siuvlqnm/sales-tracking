class Snowflake {
  private static instance: Snowflake;
  
  private sequence: bigint = BigInt(0);
  private lastTimestamp: bigint = BigInt(-1);
  
  // 开始时间戳 (2024-01-01)
  private readonly twepoch: bigint = BigInt(1704067200000);
  
  // 各部分占位数
  private readonly workerIdBits: bigint = BigInt(5);
  private readonly datacenterIdBits: bigint = BigInt(5);
  private readonly sequenceBits: bigint = BigInt(12);
  
  // 最大值
  private readonly maxWorkerId: bigint = BigInt(31);  // 2^5-1
  private readonly maxDatacenterId: bigint = BigInt(31);  // 2^5-1
  
  // 偏移量
  private readonly workerIdShift: bigint = this.sequenceBits;
  private readonly datacenterIdShift: bigint = this.sequenceBits + this.workerIdBits;
  private readonly timestampLeftShift: bigint = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;
  
  // 序列号掩码 4095 (0xFFF)
  private readonly sequenceMask: bigint = BigInt(4095);
  
  private readonly workerId: bigint;
  private readonly datacenterId: bigint;
  
  private constructor(workerId: number = 1, datacenterId: number = 1) {
    const workerIdBig = BigInt(workerId);
    const datacenterIdBig = BigInt(datacenterId);
    
    if (workerIdBig > this.maxWorkerId || workerIdBig < BigInt(0)) {
      throw new Error(`workerId can't be greater than ${this.maxWorkerId} or less than 0`);
    }
    if (datacenterIdBig > this.maxDatacenterId || datacenterIdBig < BigInt(0)) {
      throw new Error(`datacenterId can't be greater than ${this.maxDatacenterId} or less than 0`);
    }
    
    this.workerId = workerIdBig;
    this.datacenterId = datacenterIdBig;
  }
  
  public static getInstance(): Snowflake {
    if (!Snowflake.instance) {
      Snowflake.instance = new Snowflake();
    }
    return Snowflake.instance;
  }
  
  private tilNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }
  
  private timeGen(): bigint {
    return BigInt(Date.now());
  }
  
  public nextId(): string {
    let timestamp = this.timeGen();
    
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate id');
    }
    
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + BigInt(1)) & this.sequenceMask;
      if (this.sequence === BigInt(0)) {
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = BigInt(0);
    }
    
    this.lastTimestamp = timestamp;
    
    const id = ((timestamp - this.twepoch) << this.timestampLeftShift) |
               (this.datacenterId << this.datacenterIdShift) |
               (this.workerId << this.workerIdShift) |
               this.sequence;
    
    // 确保返回正数字符串
    return id.toString();
  }
}

// 导出生成ID的函数
export function generateId(): string {
  return Snowflake.getInstance().nextId();
}