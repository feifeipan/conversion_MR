conversion_MR
=============

conversion rate into dashboard each hour and each day

原因
===
因为从hbase从拉取数据耗费时间比较长，而这批数据一般以1小时、1天作为间隔展示。

所以使用nodejs的request模块，来从hbase api中定时获取数据，并抛入到dashboard中。

前端展示只需要从dashboard中直接读取即可

设计
===

接口
====
http://192.168.81.210:8080/ubt/conversion/fuzzy/page/100101991/100003/100101991?start=1372322693000&stop=1372329893000 

http://192.168.49.113:8080/ubt/conversion/fuzzy/page/100101991/100003/100101991?start=1372322693000&stop=1372329893000


因为通过此接口需要查询的内容很多，而且conversion rate实时性不是很强，所以在固定周期进行独立汇总进入dashboard，前台通过dashboard进行数据查询，提升性能。

【周期】

1小时（1h）、1天（1d）、1周（1w）、1月（1M）

【内容】

记录固定周期5个主流程页面的conversion rate。

【Metrics和Tag的设计】

Metrics: Conversion_Count

Tags:

Tag  Description
channel	主流程频道的名称
page	页面page_id
step	主流程步骤(从0开始)
Value:

每一个页面/步骤的convertionCount数



Metrics: Conversion_Rate

Tags:

Tag	Description
channel	主流程频道的名称
page	页面page_id
step	主流程步骤(从0开始)
Value:

每一个页面/步骤的conversionRate比率


