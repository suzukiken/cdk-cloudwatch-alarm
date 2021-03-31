import boto3
import json
from datetime import datetime

client = boto3.client('lambda')

dt = datetime.now().isoformat()

for i in range(10):
    response = client.invoke(
        FunctionName='cdkcloudwatchalarm-monitored',
        InvocationType='Event',
        Payload=json.dumps({
            'datetime': dt,
            'count': i,
        })
    )
    
    print(response)