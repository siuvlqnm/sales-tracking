class Snowflake {
  private static instance: Snowflake;
  private sequence: number = 0;
  private lastTimestamp: number = -1;
  
  private constructor() {}
  
  static getInstance(): Snowflake {
    if (!Snowflake.instance) {
      Snowflake.instance = new Snowflake();
    }
    return Snowflake.instance;
  }

  generate(): string {
    let timestamp = Date.now();
    
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards!');
    }
    
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 4095;
      if (this.sequence === 0) {
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }
    
    this.lastTimestamp = timestamp;
    
    const id = ((timestamp & 0x1FFFFFFFFFF) << 22) |
               ((this.sequence & 0xFFF));
               
    return id.toString();
  }

  private tilNextMillis(lastTimestamp: number): number {
    let timestamp = Date.now();
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}

export const generateId = () => Snowflake.getInstance().generate(); 