# Test cases for DASC VM contract

## data section
```
.data
   a 1
   b -1
   c 0x02
   d  "abc" 
   e[2] 0
   f[4]  "012345670123456701234567abcdefgh" 
   example[3] [ 1823525992471050800  , 0xfede, "auxiliar" ]
```

## bss section
```
.data
.zeroall
   a
   b[2]
```

## SET (immediate), SET16 and SET64
```
.bss
m[10]
.code
SET m_0, 0
SET m_1, 1
SET m_2, -1
SET16 m_3, 4386
SET16 m_4, -13124
SET16 m_5, 0xFFFF
SET64 m_6, 1234605616436508552
SET64 m_7, -8613303245920329199
SET64 m_8, 0x8081828384858687
RST
```
Expect the variables to be set accordingly

## Target bit param
```
.data
.define headerAdr 0
m0 1
.code
SET m0, 16
SET $, 31
SET *m0, 33
SET *0xb, 12
SET *headerAdr, 0x11
RST
```
Expect R=31, m0=16, m16=33, memory location 12 = 12,  overwrite program header with 0x11.

## Source bit param
```
.bss
m[17]
.code
SET $, 25
SET m_0, &m_15
SET m_15, 31
SET m_1, m_0
SET m_2, *m_0
SET m_3, $
SET m_4, *0
```
Expect R=25, m_0=16, m_1=16, m_2=31, m_3=25, m_15=31, m_4=header.

## Operations
```
.data
m[11] [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 77]
.code
SET $, 4
SLEEP 1
NOT m_0
ADD m_1, $
SUB m_2, $
MUL m_3, $
DIV m_4, $
OR  m_5, 3
XOR m_6, $
SHL m_7, $
SHR m_8, 2
AND m_9, 1
MOD m_10, 55
```
Expect R=4, m_0=-2, m_1=5, m_2=-2, m_3=12, m_4=1, m_5=7, m_6=2, m_7=112, m_8=2, m_9=1, m_10=22

## Branches - True
```
.data
    m0 0
.code
    XOR $, $
    SET m0, 10
    BZ next1
    ADD m0, 1
next1:
    SET $, 1
    BNZ next2
    ADD m0, 1
next2:
    BGZ next3
    ADD m0, 1
next3:
    SET $, -1
    BLZ next4
    ADD m0, 1
next4:
    SET $, 0
    BGEZ next5
    ADD m0, 1
next5:
    BLEZ next6
    ADD m0, 1
next6:
    BA next7
    ADD m0, 1
next7:
    RST
```
Expect m0=10.

## Branches - False
```
.data
    m0 0
.code
    XOR $, $
    SET m0, $
    BNZ next1
    ADD m0, 1
next1:
    SET $, 1
    BZ next2
    ADD m0, 1
next2:
    BLEZ next3
    ADD m0, 1
next3:
    SET $, -1
    BGEZ next4
    ADD m0, 1
next4:
    SET $, 0
    BLZ next5
    ADD m0, 1
next5:
    BGZ next6
    ADD m0, 1
next6:
    RST
```
Expect m0=6.

```
.data
    m0 0

.code
    BNZ distant
    BZ distant
    BLEZ distant
    BGEZ distant
    BLZ distant
    BGZ distant
    NOP
    BA distant
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
    SET64 m0, 0x1011121314151617
distant:
    RST
```
Expect branches replaced by jumps

### Extended branches
**True**
```
.data
    m0 10
    m1 10
.code
    BX m0 == m1, next1
    ADD m0, 1
next1:
    SET m1, 1
    BX m0 != m1, next2
    ADD m0, 1
next2:
    BX m0 > m1,  next3
    ADD m0, 1
next3:
    BX m1 < m0, next4
    ADD m0, 1
next4:
    SET m1, m0
    BX m0 >= m1, next5
    ADD m0, 1
next5:
    BX m0 <= m1, next6
    ADD m0, 1
next6:
    SET m1, 0
    BX m1 == 0, next7
    ADD m0, 1
next7:
    SET m1, -1
    BX m1 != 0, next8
    ADD m0, 1
next8:
    RST
```
Expect m0=10.

**False**
```
.data
    m0 10
    m1 10
.code
    BX m0 != m1, next1
    ADD m0, 1
next1:
    SET m1, 1
    BX m0 == m1, next2
    ADD m0, 1
next2:
    BX m0 <= m1,  next3
    ADD m0, 1
next3:
    BX m1 >= m0, next4
    ADD m0, 1
next4:
    SET m1, m0
    BX m0 < m1, next5
    ADD m0, 1
next5:
    SET m1, m0
    BX m0 > m1, next6
    ADD m0, 1
next6:
    SET m1, 0
    BX m1 != 0, next7
    ADD m0, 1
next7:
    SET m1, -1
    BX m1 == 0, next8
    ADD m0, 1
next8:
    RST
```
Expect m0=18.

**Long jump**
```
.data
    m0 10
    m1 10
.code
    BX m0 != m1, distant
    BX m0 == m1, distant
    BX m0 <= m1, distant
    BX m1 >= m0, distant
    BX m0 < m1, distant
    BX m0 > m1, distant
    BX m1 != 0, distant
    BX m1 == 0, distant
    SET64 m0, 0x1011121314151617
distant:
    RST
```

## Functions
### Function calling other function.
For this example, function arguments will be set before function call and the return value will be received by R register ($).

```
.code
   BA entry    # First intruction jumps to main code at the end.

# *************************
# FUNCTION fn_modValue: Returns the modulus of argument 1
.bss
    fn_modValue_arg1
.code
fn_modValue:
    SET $, arg1
    BGEZ alreadyPositive
    NOT $
    ADD $, 1
alreadyPositive:
    RET

# *************************
# FUNCTION fn_modAddValues: Returns the sum of the modulus of two arguments.
#   We need to store return address because calling other function
#   will overwrite the return address to the caller.
.bss
    fn_modAddValues_arg1
    fn_modAddValues_arg2
    accumulator
    callerRA
.code
fn_modAddValues:
    SRA
    SET callerRA, $
    SET fn_modValue_arg1, fn_modAddValues_arg1
    CALL fn_modValue
    SET accumulator, $
    SET fn_modValue_arg1, fn_modAddValues_arg2
    CALL fn_modValue
    ADD accumulator, $
    SET $, callerRA
    LRA
    SET $, accumulator
    RET

# *************
# Main code
.data
    m0 2555555
    m1 -4444
.code
entry:
    SET fn_modAddValues_arg1, m0
    SET fn_modAddValues_arg2, m1
    CALL fn_modAddValues
    SET m2, $
    RST
```
Expect m2=2559999.

### Stack implementation
Implements a simple stack at the end of free memory.
```
.data
    m[3] [1234, 2345, 3456]
    t[0] 0

.code

SET $, m_0
CALL _push

SET $, m_1
CALL _push

CALL _pop
SET t_0, $

SET $, m_2
CALL _push

CALL _pop
SET t_1, $

CALL _pop
SET t_2, $

RST

# *******
# Stack implementation. No overflow/underflow checks.
#
.data
    stackVal 255
.code
_push:
   SET *stackVal, $
   SUB stackVal, 1
   RET
_pop:
   ADD stackVal, 1
   SET $, *stackVal
   RET
```
Expect t_0=2345, t_1=3456, t_2=1234;
