# Test cases for DASC VM contract

## SET (immediate), SET16 and SET64
```
SET m0, 0
SET m1, 1
SET m2, -1
SET16 m3, 4386
SET16 m4, -13124
SET16 m5, 0xFFFF
SET64 m6, 1234605616436508552
SET64 m7, -8613303245920329199
SET64 m8, 0x8081828384858687
```
Expect the variables to be set accordingly

## Target bit param
```
SET m0, 16
SET $, 31
SET *m0, 33
```
Expect R=31, m0=16, m16=33.

## Source bit param
```
.adr m16 16

SET $, 25
SET m0, 16
SET m16, 31
SET m1, m0
SET m2, *m0
SET m3, $
```
Expect R=25, m0=16, m1=16, m2=31, m3=25, m16=31.

## Operations
```
SET $, 4
SET m0, 1
SET m1, 1
SET m2, 2
SET m3, 3
SET m4, 4
SET m5, 5
SET m6, 6
SET m7, 7
SET m8, 8
SET m9, 9
SLEEP
NOT m0
ADD m1, $
SUB m2, $
MUL m3, $
DIV m4, $
OR  m5, 3
XOR m6, $
SHL m7, $
SHR m8, 2
AND m9, 1
```
Expect R=4, m0=-2, m1=5, m2=-2, m3=12, m4=1, m5=7, m6=2, m7=112, m8=2, m9=1.

## Branches - True
```
    XOR $, $
    SET m0, $
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
Expect m0=0.

## Branches - False
```
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

## Functions

TODO

## Libraries

TODO
