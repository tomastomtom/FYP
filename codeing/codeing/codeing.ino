#include "ENGG1100.h"
FSMClass FSM1;
OutputClass DRed(A1);
OutputClass DAmber(A2);
OutputClass DGreen(A3);
TM1637DisplayClass LEDDisplay(D10,D11);
void setup()
{
Serial.begin(115200); 
LEDDisplay.setBrightness(15);
FSM1.init(RED); 
}
void loop()
{
FSM1.run();
}
void RED()
{
if(FSM1.doTask())
{
DRed.setHiLow(1);
DGreen.setHiLow(0);
DAmber.setHiLow(0);
}
if (FSM1.getTime() > 5000)  FSM1.transit(RED_AMBER);
}
void RED_AMBER()
{
if(FSM1.doTask())
{
DGreen.setHiLow(0);
DRed.setHiLow(1);
DAmber.setHiLow(1);
}
if (FSM1.getTime() > 1000)  FSM1.transit(GREEN);
}
void GREEN()
{
if(FSM1.doTask())
{
DGreen.setHiLow(1);
DAmber.setHiLow(0);
DRed.setHiLow(0);
}
if (FSM1.getTime() > 5000)  FSM1.transit(AMBER);
}
void AMBER()
{
if(FSM1.doTask())
{
DGreen.setHiLow(0);
DAmber.setHiLow(1);
DRed.setHiLow(0);
}
if (FSM1.getTime() > 1000)  FSM1.transit(RED);
}
