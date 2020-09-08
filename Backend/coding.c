#include<stdio.h>
#include <stdlib.h>
#include <string.h>
#include<json-c/json.h>
//#include <zlib.h>
int main(int argc, char **argv) {
	FILE *fp;
	char buffer[1024];
	char input[1024];
	struct json_object *parsed_json;
	struct json_object *node;
	struct json_object *link;
	struct json_object *fromnode[256];
	struct json_object *type[256];
	struct json_object *tonode[256];
	struct json_object *nodename[256];
	struct json_object *entryaction[256][256];
	struct json_object *entryvalue[256][256];
	struct json_object *condition[256];
	struct json_object *temp;
	struct json_object *temp2;
	struct json_object *code;
	size_t n_node;
	size_t n_links;
	size_t n_action[1024];
	int i;
	int j;
	int k;
	int startlink;
	char temptime[4];
	char tempstring[1024];
	char temptonode[1024];

	//printf("hI Welcome\n");
	fp = fopen("fsm.json","rw");
	//printf("pass 1\n");
	if (fp == NULL){
		printf("can't read the file!\n");
		exit(1);
	}
	else {
		printf("File Success open!\n");
	}
	//printf("pass 2\n");
	fread(buffer, 1048576, 1, fp);
	//printf("pass 3\n");
	fclose(fp);

	parsed_json = json_tokener_parse(buffer);
	//printf("pass 4\n");
	//printf("%s\n",json_object_get_string(parsed_json) );
	json_object_object_get_ex(parsed_json, "nodes", &node);
	json_object_object_get_ex(parsed_json, "links", &link);
	//printf("pass 5\n");
	//printf("%s\n",json_object_get_string(node) );
	n_node = json_object_array_length(node);
	//printf("pass 6\n");
	printf("Found %lu node\n",n_node);
	n_links = json_object_array_length(link);
	printf("Found %lu link\n",n_links);
	//printf("pass 6\n");

	for(i=0;i<n_node;i++) {
		temp = json_object_array_get_idx(node, i);
		//printf("%s\n",json_object_get_string(temp) );
  		json_object_object_get_ex(temp, "text" , &nodename[i]);
		json_object_object_get_ex(temp, "entryActions" , &code);
		//printf("%s\n",json_object_get_string(code) );
		n_action[i] = json_object_array_length(code);
		for(j=0;j<n_action[i];j++)
		{
			temp2 = json_object_array_get_idx(code, j);
			json_object_object_get_ex(temp2, "action" , &entryaction[i][j]);
			//printf("%lu %lu" , i , j);
			//printf("test action= : %s\n" , json_object_get_string(entryaction[i][j]));
			json_object_object_get_ex(temp2, "value" , &entryvalue[i][j]);
		}
		//printf("%lu. node: \n",i+1 );
		//printf("Name of node = : %s\n" , json_object_get_string(nodename[i]));
		//for(j=0;j<n_action[i];j++){
		//	printf("Action of node = : %s\n" , json_object_get_string(entryaction[i][j]));
	//		printf("value of node = : %s\n" , json_object_get_string(entryvalue[i][j]));
	//}
	}

	for(i=0;i<n_links;i++) {
		temp = json_object_array_get_idx(link, i);
		json_object_object_get_ex(temp, "type" , &type[i]);
		printf("%s\n",json_object_get_string(type[i]));
		if (strcmp(json_object_get_string(type[i]),"SelfLink" ) == 0)
		{
			//printf("Doing selflink\n");
			json_object_object_get_ex(temp, "node" , &fromnode[i]);
			json_object_object_get_ex(temp, "text" , &condition[i]);
		}
		else if (strcmp(json_object_get_string(type[i]),"StartLink" )== 0)
		{
			//printf("Doing startlink\n");
			//printf("%d\n" , startlink);
			json_object_object_get_ex(temp, "node" , &fromnode[i]);
			startlink = atoi(json_object_get_string(fromnode[i]));
		}
		else if (strcmp(json_object_get_string(type[i]),"Link" )== 0)
		{
		//	printf("Doing link\n");
	  		json_object_object_get_ex(temp, "nodeA" , &fromnode[i]);
			json_object_object_get_ex(temp, "nodeB" , &tonode[i]);
			json_object_object_get_ex(temp, "text" , &condition[i]);
		}
		else
		{
			printf("Error of the link!\n");
					exit(1);
		}

		///printf("%lu. node: %s\n",i+1,json_object_get_string(name) );
		//printf("Name of node = : %s\n" , json_object_get_string(nodename[i]));
		//printf("Code of node = : %s\n" , json_object_get_string(nodecode[i]));
	}	


	for(i=0;i<n_node;i++)
{
		printf("Name of node = : %s\n" , json_object_get_string(nodename[i]));
		for(j=0;j<n_action[i];j++){
			printf("Action of node = : %s\n" , json_object_get_string(entryaction[i][j]));
			printf("value of node = : %s\n" , json_object_get_string(entryvalue[i][j]));
	}
} 
/*
	for(i=0;i<n_links;i++)
{
		printf("First From node = : %s\n" , json_object_get_string(fromnode[i]));
		printf("First To node = : %s\n" , json_object_get_string(tonode[i]));
		printf("condition= : %s\n" , json_object_get_string(condition[i]));
} 
		
*/




//write file 
	 fp = fopen("codeing/codeing.ino","w");
	 if(fp == NULL)
  	 {
  	   printf("Error for create new file!!");
   	   exit(1);
  	 }
	 fprintf(fp,"#include \"ENGG1100.h\"\n");
	 fprintf(fp,"FSMClass FSM1;\n");
	 fprintf(fp,"OutputClass DRed(A1);\n");
	 fprintf(fp,"OutputClass DAmber(A2);\n");
	 fprintf(fp,"OutputClass DGreen(A3);\n");
	 fprintf(fp,"TM1637DisplayClass LEDDisplay(D10,D11);\n");
	 fprintf(fp,"SensorClass SW14(A6);\n");
	 fpritnf(fp,"SensorClass SW15(A7);\n");
	 fprintf(fp,"void setup()\n");
	 fprintf(fp,"{\n");
	 fprintf(fp,"Serial.begin(115200); \n");
	 fprintf(fp,"LEDDisplay.setBrightness(15);\n");
	 fprintf(fp, "FSM1.init(%s); \n", json_object_get_string(nodename[startlink]));
	 fprintf(fp,"}\n");
	 fprintf(fp,"void loop()\n");
	 fprintf(fp,"{\n");
	 fprintf(fp,"FSM1.run();\n");
	 fprintf(fp,"}\n");
	 for (i = 0 ; i < n_node ; i++)
	 {
		 fprintf(fp,"void %s()\n" , json_object_get_string(nodename[i]));
		 fprintf(fp,"{\n");
		 fprintf(fp,"if(FSM1.doTask())\n");
		 fprintf(fp,"{\n");
		 for (j = 0; j < n_action[i] ; j++ )
		 {
			 if (strstr(json_object_get_string(entryaction[i][j]) , "Red") != NULL)
				 if (strcmp(json_object_get_string(entryvalue[i][j]) , "On"))
					 fprintf(fp,"DRed.setHiLow(0);\n");
				 else
					 fprintf(fp,"DRed.setHiLow(1);\n");

			 if (strstr(json_object_get_string(entryaction[i][j]) , "Green") != NULL)
				 if (strcmp(json_object_get_string(entryvalue[i][j]) , "On"))
					 fprintf(fp,"DGreen.setHiLow(0);\n");
				 else
					 fprintf(fp,"DGreen.setHiLow(1);\n");

			 if (strstr(json_object_get_string(entryaction[i][j]) , "Amber") != NULL)
				 if (strcmp(json_object_get_string(entryvalue[i][j]) , "On"))
					 fprintf(fp,"DAmber.setHiLow(0);\n");
				 else
					 fprintf(fp,"DAmber.setHiLow(1);\n");
			 if (strstr(json_object_get_string(entryaction[i][j]) , "Display") != NULL)
				 fprintf(fp , "LEDDisplay.setValue(%s);\n" , json_object_get_string(entryvalue[i][j]));

		 }


fprintf(fp,"}\n");


			 for (k = 0 ; k < n_links ; k++){
				if (strcmp(json_object_get_string(type[k]),"SelfLink" ) == 0)
				{
					if (i == atoi(json_object_get_string(fromnode[k])))
					{
						     if (strstr(json_object_get_string(condition[k]) , "time") != NULL)
                                                {
                                                        strcpy(tempstring , json_object_get_string(condition[k]));
                                                strncpy(temptime, &tempstring[6], 4);
                                                temptime[4] = '\0';
                                                fprintf(fp , "if (FSM1.getTime() > %s)  FSM1.transit(%s);\n" , temptime,json_object_get_string(nodename[i]));
                                           
						
					}	
					}
				}
				else if (strcmp(json_object_get_string(type[k]),"Link" )== 0)
				{
					if (i == atoi(json_object_get_string(fromnode[k])))
					{
						if (strstr(json_object_get_string(condition[k]) , "time") != NULL)
						{
							strcpy(tempstring , json_object_get_string(condition[k]));
					        strncpy(temptime, &tempstring[6], 4);
					        temptime[4] = '\0';
					        strcpy(temptonode , json_object_get_string(tonode[k]));
					       // printf("Stop Right Here");
					        fprintf(fp , "if (FSM1.getTime() > %s)  FSM1.transit(%s);\n" , temptime,json_object_get_string(nodename[atoi(temptonode)]));
						}
					}
				}


		 };




		 
		 fprintf(fp,"}\n");
	 }
	// fprintf(fp,"printf(\"Hello World\");\n");
	// fprintf(fp,"return 0;\n");
	// fprintf(fp,"}\n");
  	 fclose(fp);
printf("File Wrote!\n");
	printf("End Wrote!\n");
}

